import { Injectable } from "@nestjs/common";
import { Request, Response } from "express";
import { LoginSession } from "../entity/login-session.entity";
import { Client } from "../entity/client.entity";
import { LoginSessionService } from "./login-session.service";
import { CsrfTokenService } from "./csrf-token.service";
import { FlowIdCookieService } from "./flow-id-cookie.service";
import { AuthUserService } from "../casl/authUser.service";
import { AuthCodeService } from "./auth-code.service";
import { Environment } from "../config/environment.service";
import { AuthorizeQueryParams, ValidatedAuthorizeRequest } from "./authorize.service";

@Injectable()
export class SessionHelperService {
    constructor(
        private readonly loginSessionService: LoginSessionService,
        private readonly csrfTokenService: CsrfTokenService,
        private readonly flowIdCookieService: FlowIdCookieService,
        private readonly authUserService: AuthUserService,
        private readonly authCodeService: AuthCodeService,
    ) {}

    async resolveSession(req: Request, maxAge?: number): Promise<LoginSession | null> {
        const sid = (req as any).signedCookies?.sid;
        if (!sid) return null;

        const session = await this.loginSessionService.findSessionBySid(sid);
        if (!session) return null;

        if (maxAge !== undefined) {
            const elapsed = Math.floor(Date.now() / 1000) - session.authTime;
            if (elapsed > maxAge) return null;
        }
        return session;
    }

    async issueCodeAndRedirect(
        res: Response,
        session: LoginSession,
        client: Client,
        query: AuthorizeQueryParams,
        validated: ValidatedAuthorizeRequest,
    ): Promise<void> {
        const user = await this.authUserService.findUserById(session.userId);
        const authCode = await this.authCodeService.createAuthToken(
            user,
            client.tenant,
            query.client_id!,
            validated.codeChallenge || null,
            validated.codeChallenge ? (validated.codeChallengeMethod || 'plain') : null,
            validated.subscriberTenantHint,
            validated.redirectUri,
            validated.scope,
            validated.nonce,
            session.sid,
            false,
            validated.resource,
        );
        const params = new URLSearchParams();
        params.set('code', authCode);
        if (validated.state) params.set('state', validated.state);
        this.flowIdCookieService.clear(res);
        res.redirect(302, `${validated.redirectUri}?${params.toString()}`);
    }

    redirectToAuthorizeUI(
        res: Response,
        query: AuthorizeQueryParams,
        validated: ValidatedAuthorizeRequest,
        view: 'login' | 'consent' | 'session-confirm',
        flowId: string = '',
    ): void {
        const params = new URLSearchParams();

        params.set('view', view);
        params.set(
            'csrf_token',
            flowId ? this.csrfTokenService.computeFromFlowId(flowId) : '',
        );

        params.set('client_id', query.client_id!);
        params.set('redirect_uri', validated.redirectUri);
        params.set('response_type', validated.responseType);
        params.set('scope', validated.scope);
        params.set('state', validated.state);
        if (validated.codeChallenge) {
            params.set('code_challenge', validated.codeChallenge);
            params.set('code_challenge_method', validated.codeChallengeMethod);
        }
        if (validated.nonce) params.set('nonce', validated.nonce);
        if (validated.resource) params.set('resource', validated.resource);
        if (validated.prompt) {
            if (validated.prompt === 'consent' && view === 'consent') {
            } else {
                params.set('prompt', validated.prompt);
            }
        }
        if (validated.maxAge !== undefined) params.set('max_age', String(validated.maxAge));
        if (query.id_token_hint) params.set('id_token_hint', query.id_token_hint);
        if (validated.subscriberTenantHint) {
            params.set('subscriber_tenant_hint', validated.subscriberTenantHint);
        }

        res.redirect(302, `${Environment.get('BASE_URL', '')}/authorize?${params.toString()}`);
    }

    redirectWithError(
        res: Response,
        redirectUri: string,
        error: string,
        description: string,
        state?: string,
    ): void {
        const params = new URLSearchParams();
        params.set('error', error);
        params.set('error_description', description);
        if (state) params.set('state', state);
        this.flowIdCookieService.clear(res);
        res.redirect(302, `${redirectUri}?${params.toString()}`);
    }

    getSidCookieOptions(maxAge: number): Record<string, any> {
        return {
            signed: true,
            httpOnly: true,
            secure: String(Environment.get('BASE_URL', '')).startsWith('https'),
            sameSite: 'lax' as const,
            path: '/api/oauth',
            maxAge: maxAge * 1000,
        };
    }
}
