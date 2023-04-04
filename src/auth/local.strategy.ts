import {CanActivate, ExecutionContext, Injectable} from '@nestjs/common';
import {AuthService} from './auth.service';
import {User} from '../users/user.entity';
import {Request} from 'express';
import {ValidationErrorException} from "../exceptions/validation-error.exception";

@Injectable()
export class LocalStrategy implements CanActivate {
    constructor(private readonly authService: AuthService) {
        // Pass a configuration object to change the strategy.
        // Use email instead of username.
    }

    async validate(email: string, password: string): Promise<User> {
        try {
            const user: User = await this.authService.validate(email, password);
            return user; // Passport stores the user in the request.
        } catch (exception: any) {
            throw exception;
        }
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        try {
            const body = this.extractCredentials(request);
            const user = await this.validate(body.email, body.password);
            // 💡 We're assigning the payload to the request object here
            // so that we can access it in our route handlers
            request['user'] = user;
        } catch (e) {
            throw e;
        }
        return true;
    }

    extractCredentials(request: Request): any {
        const email = request.body['email'] || null;
        const password = request.body['password'] || null;
        if (email === null) {
            throw new ValidationErrorException("email not found.");
        }
        if (password === null) {
            throw new ValidationErrorException("password not found.");
        }
        return {email, password};
    }
}
