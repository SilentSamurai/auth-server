import {
    Body,
    Controller,
    HttpCode,
    Logger,
    Post,
    Req,
    Res,
    UseFilters,
    UseInterceptors,
    ClassSerializerInterceptor,
} from "@nestjs/common";
import {Request as ExpressRequest, Response} from "express";

import {AuthService} from "../auth/auth.service";
import {ValidationPipe} from "../validation/validation.pipe";
import {ValidationSchema} from "../validation/validation.schema";
import {AuthCodeService} from "../auth/auth-code.service";
import {GRANT_TYPES} from "../casl/contexts";
import {AuthUserService} from "../casl/authUser.service";
import {TokenIssuanceService} from "../auth/token-issuance.service";
import {OAuthException} from "../exceptions/oauth-exception";
import {OAuthExceptionFilter} from "../exceptions/filter/oauth-exception.filter";
import {User} from "../entity/user.entity";
import {CryptUtil} from "../util/crypt.util";
import {parseBasicAuthHeader} from "../util/http.util";
import {Client} from "../entity/client.entity";
import {ClientService} from "../services/client.service";
import {CorsOriginService} from "../services/cors-origin.service";
import {ResourceIndicatorValidator} from "../auth/resource-indicator.validator";
import {RefreshTokenService} from "../auth/refresh-token.service";

const logger = new Logger("TokenController");

@Controller("api/oauth")
@UseFilters(OAuthExceptionFilter)
@UseInterceptors(ClassSerializerInterceptor)
export class TokenController {
    constructor(
        private readonly authService: AuthService,
        private readonly authCodeService: AuthCodeService,
        private readonly authUserService: AuthUserService,
        private readonly tokenIssuanceService: TokenIssuanceService,
        private readonly clientService: ClientService,
        private readonly refreshTokenService: RefreshTokenService,
        private readonly corsOriginService: CorsOriginService,
    ) {
    }

    @HttpCode(200)
    @Post("/token")
    async oauthToken(
        @Req() req: ExpressRequest,
        @Res({passthrough: true}) res: Response,
        @Body() body: any,
    ): Promise<any> {
        let clientId = body.client_id;
        let clientSecret = body.client_secret;
        const basicCredentials = parseBasicAuthHeader(req.headers.authorization);
        if (basicCredentials) {
            clientId = basicCredentials.username;
            clientSecret = basicCredentials.password;
        }
        body.client_id = clientId;
        body.client_secret = clientSecret;

        const origin = req.headers.origin;
        if (origin && clientId) {
            try {
                if (await this.corsOriginService.isOriginAllowedForClient(origin, clientId)) {
                    res.setHeader("Access-Control-Allow-Origin", origin);
                    res.setHeader("Access-Control-Allow-Credentials", "true");
                    res.setHeader("Vary", "Origin");
                }
            } catch {
            }
        }

        switch (body.grant_type) {
            case GRANT_TYPES.CODE:
                return this.handleCodeGrant(body);
            case GRANT_TYPES.PASSWORD:
                return this.handlePasswordGrant(body);
            case GRANT_TYPES.CLIENT_CREDENTIALS:
                return this.handleClientCredentialsGrant(body);
            case GRANT_TYPES.REFRESH_TOKEN:
                return this.handleRefreshTokenGrant(body);
            default:
                throw OAuthException.unsupportedGrantType("grant type not recognised.");
        }
    }

    @Post("/exchange")
    async exchangeAccessToken(
        @Body(new ValidationPipe(ValidationSchema.ExchangeTokenSchema))
        body: {
            access_token: string;
            client_id: string;
            client_secret: string;
        },
    ): Promise<object> {
        let tenantToken = await this.authService.validateAccessToken(body.access_token);
        if (tenantToken.grant_type !== GRANT_TYPES.PASSWORD) {
            throw OAuthException.invalidGrant("The grant type of the source token is not permitted for exchange");
        }

        const client = await this.authService.validateClientCredentials(
            body.client_id,
            body.client_secret,
        );

        const user = await this.authUserService.findUserByEmail(
            tenantToken.asTenantToken().email,
        );

        const tenant = client.tenant;

        return this.tokenIssuanceService.issueToken(user, tenant);
    }

    private async handleCodeGrant(body: any): Promise<any> {
        let validationPipe = new ValidationPipe(
            ValidationSchema.CodeGrantSchema,
        );
        await validationPipe.transform(body, null);

        const authCode = await this.authCodeService.redeemAuthCode(body.code);

        if (body.client_id !== authCode.clientId) {
            logger.warn(`Auth code grant mismatch: stored client_id '${authCode.clientId}' does not match request client_id '${body.client_id}'`);
            throw OAuthException.invalidGrant("The authorization code was not issued to this client or the client_id is invalid.");
        }

        if (authCode.redirectUri) {
            if (!body.redirect_uri) {
                throw OAuthException.invalidGrant(
                    'The redirect_uri parameter is required when it was included in the authorization request'
                );
            }
            if (body.redirect_uri !== authCode.redirectUri) {
                throw OAuthException.invalidGrant(
                    'The redirect_uri does not match the value used in the authorization request'
                );
            }
        }

        if (authCode.codeChallenge) {
            if (!body.code_verifier) {
                throw OAuthException.invalidGrant("code_verifier is required when code_challenge was provided in the authorization request");
            }
            const generatedChallenge = CryptUtil.generateCodeChallenge(body.code_verifier, authCode.method);
            if (generatedChallenge !== authCode.codeChallenge) {
                throw OAuthException.invalidGrant("The authorization code is invalid or the code verifier does not match");
            }
        }

        const user = await this.authUserService.findUserById(authCode.userId);
        const tenant = await this.authUserService.findTenantById(authCode.tenantId);

        return this.tokenIssuanceService.issueToken(user, tenant, {
            subscriberTenantHint: authCode.subscriberTenantHint,
            requestedScope: body.scope || authCode.scope,
            nonce: authCode.nonce ?? undefined,
            sid: authCode.sid ?? undefined,
            grant_type: GRANT_TYPES.CODE,
            requireAuthTime: authCode.requireAuthTime,
            resource: authCode.resource ?? undefined,
            oauthClientId: authCode.clientId,
        });
    }

    private async handlePasswordGrant(body: any): Promise<any> {
        let validationPipe = new ValidationPipe(
            ValidationSchema.PasswordGrantSchema,
        );
        await validationPipe.transform(body, null);

        logger.warn(`Password grant requested by client_id '${body.client_id}'. The password grant is deprecated per OAuth 2.1.`);

        let client: Client;
        try {
            client = await this.clientService.findByClientIdOrAlias(body.client_id);
        } catch {
            throw OAuthException.unauthorizedClient('The password grant is not permitted for this client');
        }

        if (!client.allowPasswordGrant) {
            throw OAuthException.unauthorizedClient('The password grant is not permitted for this client');
        }

        const user: User = await this.authService.validate(
            body.username,
            body.password
        );

        const tenant = client.tenant;

        const resource = await this.validateResourceForTokenRequest(body.resource, body.client_id);

        return this.tokenIssuanceService.issueToken(user, tenant, {
            subscriberTenantHint: body.subscriber_tenant_hint,
            requestedScope: body.scope,
            grant_type: GRANT_TYPES.PASSWORD,
            resource,
            oauthClientId: body.client_id,
        });
    }

    private async handleClientCredentialsGrant(body: any): Promise<any> {
        let validationPipe = new ValidationPipe(
            ValidationSchema.ClientCredentialGrantSchema,
        );
        await validationPipe.transform(body, null);

        const client: Client =
            await this.authService.validateClientCredentials(
                body.client_id,
                body.client_secret,
            );

        let resource: string | undefined;
        if (body.resource) {
            if (!ResourceIndicatorValidator.isValidResourceUri(body.resource)) {
                throw OAuthException.invalidTarget('The resource parameter must be an absolute URI without a fragment component');
            }

            const allowedResources = client.allowedResources
                ? (typeof client.allowedResources === 'string'
                    ? JSON.parse(client.allowedResources)
                    : client.allowedResources)
                : null;
            ResourceIndicatorValidator.validateResource(body.resource, allowedResources);
            resource = body.resource;
        }

        return this.tokenIssuanceService.issueClientCredentialsToken(
            client,
            body.scope ?? null,
            resource,
        );
    }

    private async handleRefreshTokenGrant(body: any): Promise<any> {
        const validationPipe = new ValidationPipe(
            ValidationSchema.RefreshTokenGrantSchema,
        );
        await validationPipe.transform(body, null);

        let client: Client;
        try {
            client = await this.clientService.findByClientIdOrAlias(body.client_id);
        } catch {
            throw OAuthException.invalidClient('Client authentication failed');
        }

        if (client.isPublic) {
        } else {
            if (!body.client_secret) {
                throw OAuthException.invalidClient('Confidential clients must provide client_secret');
            }
            if (!this.clientService.validateClientSecret(client, body.client_secret)) {
                throw OAuthException.invalidClient('Client authentication failed');
            }
        }

        const resource = await this.validateResourceForTokenRequest(body.resource, body.client_id);

        return this.tokenIssuanceService.refreshToken(
            body.refresh_token,
            client.clientId,
            body.scope,
            resource,
            body.client_id,
        );
    }

    private async validateResourceForTokenRequest(
        resource: string | undefined,
        clientId: string,
    ): Promise<string | undefined> {
        if (!resource) {
            return undefined;
        }

        const client = await this.clientService.findByClientIdOrAlias(clientId);
        const allowedResources = client.allowedResources
            ? (typeof client.allowedResources === 'string'
                ? JSON.parse(client.allowedResources)
                : client.allowedResources)
            : null;

        ResourceIndicatorValidator.validateResource(resource, allowedResources);
        return resource;
    }
}
