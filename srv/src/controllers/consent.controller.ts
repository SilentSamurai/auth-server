import {
    BadRequestException,
    Body,
    Controller,
    Post,
    Req,
    UnauthorizedException,
    UseFilters,
    UseInterceptors,
    ClassSerializerInterceptor,
} from "@nestjs/common";
import {Request as ExpressRequest} from "express";

import {OAuthExceptionFilter} from "../exceptions/filter/oauth-exception.filter";
import {CsrfTokenService} from "../auth/csrf-token.service";
import {LoginSessionService} from "../auth/login-session.service";
import {ClientService} from "../services/client.service";
import {ScopeResolverService} from "../casl/scope-resolver.service";
import {ConsentService} from "../auth/consent.service";
import {Client} from "../entity/client.entity";

@Controller("api/oauth")
@UseFilters(OAuthExceptionFilter)
@UseInterceptors(ClassSerializerInterceptor)
export class ConsentController {
    constructor(
        private readonly csrfTokenService: CsrfTokenService,
        private readonly loginSessionService: LoginSessionService,
        private readonly clientService: ClientService,
        private readonly scopeResolverService: ScopeResolverService,
        private readonly consentService: ConsentService,
    ) {
    }

    @Post("/consent")
    async consent(
        @Req() req: ExpressRequest,
        @Body()
        body: {
            client_id: string;
            scope?: string;
            csrf_token: string;
            decision: 'grant' | 'deny';
        },
    ): Promise<{success: true}> {
        this.csrfTokenService.verifyOrThrow(
            req.signedCookies?.flow_id,
            body.csrf_token,
        );

        const sid = (req as any).signedCookies?.sid;
        if (!sid) {
            throw new UnauthorizedException('No session');
        }
        const session = await this.loginSessionService.findSessionBySid(sid);
        if (!session) {
            throw new UnauthorizedException('Session expired');
        }

        let client: Client;
        try {
            client = await this.clientService.findByClientIdOrAlias(body.client_id);
        } catch {
            throw new BadRequestException('Unknown client_id');
        }

        if (body.decision === 'grant') {
            const resolvedScopes = this.scopeResolverService.resolveScopes(
                body.scope || '', client.allowedScopes || 'openid profile email',
            );
            await this.consentService.grantConsent(session.userId, client.clientId, resolvedScopes);
        }

        return {success: true};
    }
}
