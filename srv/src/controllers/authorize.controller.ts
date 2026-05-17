import {
    Body,
    Controller,
    Get,
    Logger,
    Post,
    Query,
    Req,
    Res,
    UseFilters,
    UseInterceptors,
    ClassSerializerInterceptor,
} from "@nestjs/common";
import {Request as ExpressRequest, Response} from "express";

import {User} from "../entity/user.entity";
import {AuthService} from "../auth/auth.service";
import {ValidationPipe} from "../validation/validation.pipe";
import {ValidationSchema} from "../validation/validation.schema";
import {OAuthException} from "../exceptions/oauth-exception";
import {AuthorizeRedirectException} from "../exceptions/authorize-redirect.exception";
import {OAuthExceptionFilter} from "../exceptions/filter/oauth-exception.filter";
import {AuthorizeQueryParams, AuthorizeService} from "../auth/authorize.service";
import {Client} from "../entity/client.entity";
import {LoginSessionService} from "../auth/login-session.service";
import {ConsentService} from "../auth/consent.service";
import {ScopeResolverService} from "../casl/scope-resolver.service";
import {ClientService} from "../services/client.service";
import {Environment} from "../config/environment.service";
import {TenantAmbiguityService, TenantInfo} from "../auth/tenant-ambiguity.service";
import {FirstPartyResolver} from "../auth/first-party-resolver";
import {AppClientAuditLogger} from "../log/app-client-audit.logger";
import {AppService} from "../services/app.service";
import {FlowIdCookieService} from "../auth/flow-id-cookie.service";
import {CsrfTokenService} from "../auth/csrf-token.service";
import {SessionHelperService} from "../auth/session-helper.service";

const logger = new Logger("AuthorizeController");

@Controller("api/oauth")
@UseFilters(OAuthExceptionFilter)
@UseInterceptors(ClassSerializerInterceptor)
export class AuthorizeController {
    constructor(
        private readonly authService: AuthService,
        private readonly authorizeService: AuthorizeService,
        private readonly loginSessionService: LoginSessionService,
        private readonly consentService: ConsentService,
        private readonly scopeResolverService: ScopeResolverService,
        private readonly clientService: ClientService,
        private readonly tenantAmbiguityService: TenantAmbiguityService,
        private readonly firstPartyResolver: FirstPartyResolver,
        private readonly appClientAuditLogger: AppClientAuditLogger,
        private readonly appService: AppService,
        private readonly flowIdCookieService: FlowIdCookieService,
        private readonly csrfTokenService: CsrfTokenService,
        private readonly sessionHelper: SessionHelperService,
    ) {
    }

    @Get("/authorize")
    async authorize(
        @Query() query: AuthorizeQueryParams,
        @Req() req: ExpressRequest,
        @Res() res: Response,
    ): Promise<void> {
        try {
            const validated = await this.authorizeService.validateAuthorizeRequest(query);

            if (query.consent_denied === 'true') {
                return this.sessionHelper.redirectWithError(
                    res,
                    validated.redirectUri,
                    'access_denied',
                    'The user denied the authorization request.',
                    validated.state,
                );
            }

            if (query.from_logout === 'true' || validated.prompt === 'login') {
                const flowId = this.flowIdCookieService.mintIfAbsent(req, res);
                return this.sessionHelper.redirectToAuthorizeUI(res, query, validated, 'login', flowId);
            }

            const supportedPrompts = ['none', 'login', 'consent', undefined];
            if (validated.prompt && !supportedPrompts.includes(validated.prompt)) {
                return this.sessionHelper.redirectWithError(
                    res, validated.redirectUri,
                    'invalid_request',
                    `Unsupported prompt value: ${validated.prompt}. Supported values: none, login, consent`,
                    validated.state,
                );
            }

            const session = await this.sessionHelper.resolveSession(req, validated.maxAge);

            if (!session) {
                if (validated.prompt === 'none') {
                    return this.sessionHelper.redirectWithError(
                        res, validated.redirectUri, 'login_required', 'No valid session', validated.state,
                    );
                }
                const flowId = this.flowIdCookieService.mintIfAbsent(req, res);
                return this.sessionHelper.redirectToAuthorizeUI(res, query, validated, 'login', flowId);
            }

            const client = await this.clientService.findByClientIdOrAlias(query.client_id!);

            const isFirstParty = this.firstPartyResolver.isFirstParty(client, validated.redirectUri);

            const linkedApp = await this.appService.findByClientId(client.id);
            if (linkedApp) {
                this.appClientAuditLogger.logAuthorizeResolved({
                    appId: linkedApp.id,
                    clientId: client.clientId,
                    alias: client.alias || '',
                    userId: session.userId,
                    correlationId: '',
                });
            }

            const resolvedScopes = this.scopeResolverService.resolveScopes(
                validated.scope, client.allowedScopes || 'openid profile email',
            );

            let consentGranted = true;
            if (!isFirstParty) {
                const consentCheck = await this.consentService.checkConsent(
                    session.userId, client.clientId, resolvedScopes,
                );
                consentGranted = !consentCheck.consentRequired;
            }

            const skipConfirm = client.tenant?.skipSessionConfirm === true;
            const confirmed = query.session_confirmed === 'true';

            if (validated.prompt === 'consent') {
                if (!skipConfirm && !confirmed) {
                    const flowId = this.flowIdCookieService.mintIfAbsent(req, res);
                    return this.sessionHelper.redirectToAuthorizeUI(res, query, validated, 'session-confirm', flowId);
                }
                const flowId = this.flowIdCookieService.mintIfAbsent(req, res);
                return this.sessionHelper.redirectToAuthorizeUI(res, query, validated, 'consent', flowId);
            }

            if (!consentGranted) {
                const flowId = this.flowIdCookieService.mintIfAbsent(req, res);
                return this.sessionHelper.redirectToAuthorizeUI(res, query, validated, 'consent', flowId);
            }

            if (skipConfirm || confirmed) {
                return this.sessionHelper.issueCodeAndRedirect(res, session, client, query, validated);
            }
            const flowId = this.flowIdCookieService.mintIfAbsent(req, res);
            return this.sessionHelper.redirectToAuthorizeUI(res, query, validated, 'session-confirm', flowId);

        } catch (error) {
            if (error instanceof AuthorizeRedirectException) {
                return this.sessionHelper.redirectWithError(
                    res,
                    error.redirectUri,
                    error.errorCode,
                    error.errorDescription,
                    error.state,
                );
            }
            this.flowIdCookieService.clear(res);
            throw error;
        }
    }

    @Post("/login")
    async login(
        @Req() req: ExpressRequest,
        @Res({passthrough: true}) res: Response,
        @Body(new ValidationPipe(ValidationSchema.LoginSchema))
        body: {
            client_id: string;
            password: string;
            email: string;
            csrf_token: string;
            subscriber_tenant_hint?: string;
        },
    ): Promise<{ success: true } | { requires_tenant_selection: true; tenants: TenantInfo[] }> {
        this.csrfTokenService.verifyOrThrow(
            req.signedCookies?.flow_id,
            body.csrf_token,
        );

        const user: User = await this.authService.validate(body.email, body.password);

        let client: Client;
        try {
            client = await this.clientService.findByClientIdOrAlias(body.client_id);
        } catch {
            throw OAuthException.invalidClient('Unknown client_id');
        }

        const isDefaultClient = this.firstPartyResolver.isDefaultClient(client);

        if (!isDefaultClient && !body.subscriber_tenant_hint) {
            const subscriberTenants = await this.tenantAmbiguityService.findSubscriberTenants(
                user.id,
                client.clientId,
            );

            if (subscriberTenants.length > 1) {
                logger.log(`User ${user.email} has ${subscriberTenants.length} subscriber tenants for client ${body.client_id} — requiring selection`);
                return {
                    requires_tenant_selection: true,
                    tenants: subscriberTenants,
                };
            }
        }

        if (body.subscriber_tenant_hint) {
            const isValidHint = await this.tenantAmbiguityService.validateHint(
                user.id,
                client.clientId,
                body.subscriber_tenant_hint,
            );
            if (!isValidHint) {
                throw OAuthException.invalidRequest('Invalid subscriber_tenant_hint');
            }
        }

        const tenant = client.tenant;

        const session = await this.loginSessionService.createSession(user.id, tenant.id);

        const durationSeconds = parseInt(
            Environment.get('LOGIN_SESSION_DURATION_SECONDS', '1296000'),
            10,
        );

        res.cookie('sid', session.sid, this.sessionHelper.getSidCookieOptions(durationSeconds));

        return {success: true};
    }
}
