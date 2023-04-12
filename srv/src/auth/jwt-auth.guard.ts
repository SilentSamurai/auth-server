import {CanActivate, ExecutionContext, Injectable, Logger} from '@nestjs/common';
import {UnauthorizedException} from "../exceptions/unauthorized.exception";
import {SecurityService} from "../scopes/security.service";

@Injectable()
export class JwtAuthGuard implements CanActivate {

    private static readonly LOGGER = new Logger("JwtAuthGuard");

    constructor(
        private readonly securityService: SecurityService
    ) {
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        try {
            // 💡 We're assigning the payload to the request object here
            // so that we can access it in our route handlers
            const payload = await this.securityService.setSecurityContextFromRequest(request);
        } catch (e) {
            JwtAuthGuard.LOGGER.error("Error occurred in Security Context", e)
            throw new UnauthorizedException(e);
        }
        return true;
    }


}
