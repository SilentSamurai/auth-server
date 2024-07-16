import {CanActivate, ExecutionContext, Injectable, Logger} from '@nestjs/common';
import {UnauthorizedException} from "../exceptions/unauthorized.exception";
import {ExtractJwt} from 'passport-jwt';
import {AuthService} from "./auth.service";
import {CaslAbilityFactory} from "../casl/casl-ability.factory";
import {GRANT_TYPES} from "../casl/contexts";

@Injectable()
export class JwtAuthGuard implements CanActivate {

    private static readonly LOGGER = new Logger("JwtAuthGuard");

    constructor(
        private readonly authService: AuthService,
        private readonly caslAbilityFactory: CaslAbilityFactory,
    ) {
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        try {
            // 💡 We're assigning the payload to the request object here
            // so that we can access it in our route handlers
            const payload = await this.setSecurityContextFromRequest(request);
        } catch (e) {
            JwtAuthGuard.LOGGER.error("Error occurred in Security Context", e)
            throw new UnauthorizedException(e);
        }
        return true;
    }

    async setSecurityContextFromRequest(request: any) {
        const token = extractTokenFromHeader(request);
        if (!token) {
            throw new UnauthorizedException("No token provided");
        }
        const payload = await this.authService.validateAccessToken(token);
        if (payload.grant_type === GRANT_TYPES.PASSWORD) {
            request['user'] = payload;
        }
        const ability = this.caslAbilityFactory.createForSecurityContext(payload);
        request["SECURITY_CONTEXT"] = payload;
        request["SCOPE_ABILITIES"] = ability;
        return payload;
    }

}

function extractTokenFromHeader(request: any) {
    let extractor = ExtractJwt.fromAuthHeaderAsBearerToken();
    return extractor(request)
}
