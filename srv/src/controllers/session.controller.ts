import {
    ClassSerializerInterceptor,
    Controller,
    Get,
    Header,
    Inject,
    Query,
    Req,
    Res,
    UnauthorizedException,
    UseFilters,
    UseInterceptors,
} from "@nestjs/common";
import {Request as ExpressRequest, Response} from "express";

import {OAuthExceptionFilter} from "../exceptions/filter/oauth-exception.filter";
import {LoginSessionService} from "../auth/login-session.service";
import {AuthUserService} from "../casl/authUser.service";
import {Environment} from "../config/environment.service";
import {ClientService} from "../services/client.service";
import {IdTokenHintValidator} from "../auth/id-token-hint.validator";
import {OAuthException} from "../exceptions/oauth-exception";
import {RS256_TOKEN_GENERATOR, TokenService} from "../core/token-abstraction";

@Controller("api/oauth")
@UseFilters(OAuthExceptionFilter)
@UseInterceptors(ClassSerializerInterceptor)
export class SessionController {
    constructor(
        private readonly loginSessionService: LoginSessionService,
        private readonly authUserService: AuthUserService,
        private readonly clientService: ClientService,
        private readonly idTokenHintValidator: IdTokenHintValidator,
        @Inject(RS256_TOKEN_GENERATOR)
        private readonly tokenGenerator: TokenService,
    ) {
    }

    @Get("/session-info")
    @Header('Cache-Control', 'no-store')
    async sessionInfo(
        @Req() req: ExpressRequest,
    ): Promise<{ email: string }> {
        const sid = (req as any).signedCookies?.sid;
        if (!sid) {
            throw new UnauthorizedException('No session');
        }

        const session = await this.loginSessionService.findSessionBySid(sid);
        if (!session) {
            throw new UnauthorizedException('Session expired');
        }

        const user = await this.authUserService.findUserById(session.userId);
        return {email: user.email};
    }

    @Get("/logout")
    async rpInitiatedLogout(
        @Query() query: { post_logout_redirect_uri?: string; state?: string; id_token_hint?: string; client_id?: string },
        @Res() res: Response,
    ): Promise<void> {
        const {post_logout_redirect_uri, state, id_token_hint, client_id} = query;

        // At least one of id_token_hint or client_id is REQUIRED per OIDC RP-Initiated Logout 1.0 §2
        if (!id_token_hint && !client_id) {
            throw OAuthException.invalidRequest(
                'At least one of id_token_hint or client_id is required',
            );
        }

        let resolvedClientId: string;

        if (id_token_hint) {
            if (client_id) {
                resolvedClientId = client_id;
            } else {
                // Extract client_id from the hint's aud claim
                const decoded = this.tokenGenerator.decodeComplete(id_token_hint);
                const aud = decoded.payload.aud;
                if (!aud) {
                    throw OAuthException.invalidRequest(
                        'The id_token_hint must contain an aud claim',
                    );
                }
                const audValues = Array.isArray(aud) ? aud : [aud];
                let found = false;
                for (const candidate of audValues) {
                    try {
                        await this.clientService.findByClientId(candidate);
                        resolvedClientId = candidate;
                        found = true;
                        break;
                    } catch {
                        continue;
                    }
                }
                if (!found) {
                    throw OAuthException.invalidRequest(
                        'The id_token_hint aud does not match any known client',
                    );
                }
            }

            // Validate the id_token_hint signature and audience
            await this.idTokenHintValidator.validate(id_token_hint, resolvedClientId);
        } else {
            resolvedClientId = client_id!;
        }

        // Resolve the client for post_logout_redirect_uri validation
        const client = await this.clientService.findByClientId(resolvedClientId);

        if (post_logout_redirect_uri) {
            this.clientService.validatePostLogoutRedirectUri(client, post_logout_redirect_uri);
        }

        // Forward validated parameters to the UI logout page
        const params = new URLSearchParams();
        if (post_logout_redirect_uri) {
            params.set('post_logout_redirect_uri', post_logout_redirect_uri);
        }
        if (state) {
            params.set('state', state);
        }
        res.redirect(302, `${Environment.get('BASE_URL', '')}/logout?${params.toString()}`);
    }
}
