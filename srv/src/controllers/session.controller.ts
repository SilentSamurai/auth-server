import {
    Controller,
    Get,
    Header,
    Query,
    Req,
    Res,
    UnauthorizedException,
    UseFilters,
    UseInterceptors,
    ClassSerializerInterceptor,
} from "@nestjs/common";
import {Request as ExpressRequest, Response} from "express";

import {OAuthExceptionFilter} from "../exceptions/filter/oauth-exception.filter";
import {LoginSessionService} from "../auth/login-session.service";
import {AuthUserService} from "../casl/authUser.service";
import {Environment} from "../config/environment.service";

@Controller("api/oauth")
@UseFilters(OAuthExceptionFilter)
@UseInterceptors(ClassSerializerInterceptor)
export class SessionController {
    constructor(
        private readonly loginSessionService: LoginSessionService,
        private readonly authUserService: AuthUserService,
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
        @Query() query: { post_logout_redirect_uri?: string; state?: string; id_token_hint?: string },
        @Res() res: Response,
    ): Promise<void> {
        const params = new URLSearchParams();
        if (query.post_logout_redirect_uri) {
            params.set('post_logout_redirect_uri', query.post_logout_redirect_uri);
        }
        if (query.state) {
            params.set('state', query.state);
        }
        res.redirect(302, `${Environment.get('BASE_URL', '')}/logout?${params.toString()}`);
    }
}
