import {CanActivate, ExecutionContext, Injectable, Logger} from '@nestjs/common';
import {ExtractJwt} from 'passport-jwt';
import {AuthService} from "./auth.service";

@Injectable()
export class JwtAuthGuard implements CanActivate {

    private static readonly LOGGER = new Logger("JwtAuthGuard");

    constructor(
        private readonly authService: AuthService
    ) {
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        try {
            const token = this.extractToken(request);
            const user = await this.authService.validateAccessToken(token);

            // 💡 We're assigning the payload to the request object here
            // so that we can access it in our route handlers
            request['user'] = user;
        } catch (e) {
            JwtAuthGuard.LOGGER.error("Error occurred in Security Context", e)
            throw e;
        }
        return true;
    }

    private extractToken(request: any) {
        let extractor = ExtractJwt.fromAuthHeaderAsBearerToken();
        return extractor(request)
    }
}
