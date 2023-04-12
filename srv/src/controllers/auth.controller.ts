import {
    BadRequestException,
    Body,
    ClassSerializerInterceptor,
    Controller,
    Get,
    Headers,
    Param,
    Post,
    Response,
    UseInterceptors
} from '@nestjs/common';

import {User} from '../users/user.entity';
import {ConfigService} from '../config/config.service';
import {AuthService} from '../auth/auth.service';
import {UsersService} from '../users/users.service';
import {MailService} from '../mail/mail.service';
import {ValidationPipe} from '../validation/validation.pipe';
import {ValidationSchema} from '../validation/validation.schema';
import {MailServiceErrorException} from '../exceptions/mail-service-error.exception';
import {TenantService} from "../tenants/tenant.service";
import {Tenant} from "../tenants/tenant.entity";
import {GRANT_TYPES} from "../scopes/security.service";

@Controller('api/oauth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
    constructor(
        private readonly configService: ConfigService,
        private readonly authService: AuthService,
        private readonly usersService: UsersService,
        private readonly tenantService: TenantService,
        private readonly mailService: MailService
    ) {
    }

    @Post('/token')
    async signin(
        @Body() body: {
            client_id: string,
            client_secret: string,
            domain: string,
            password: string,
            email: string;
            grant_type: GRANT_TYPES,
            scopes: string[]
        }
    ): Promise<object> {

        switch (body.grant_type) {
            case GRANT_TYPES.PASSWORD: {
                let validationPipe = new ValidationPipe(ValidationSchema.PasswordGrantSchema);
                await validationPipe.transform(body, null);
                const user: User = await this.authService.validate(body.email, body.password);
                const tenant = await this.tenantService.findByDomain(body.domain);
                const {accessToken, refreshToken} = await this.authService.createUserAccessToken(user, tenant);
                return {
                    token: accessToken,
                    expires_in: this.configService.get('TOKEN_EXPIRATION_TIME'),
                    token_type: "bearer",
                    refresh_token: refreshToken
                };
            }
            case GRANT_TYPES.CLIENT_CREDENTIAL: {
                let validationPipe = new ValidationPipe(ValidationSchema.ClientCredentialGrantSchema);
                await validationPipe.transform(body, null);
                const tenant: Tenant = await this.authService.validateClientCredentials(body.client_id, body.client_secret);
                const token: string = await this.authService.createTechnicalAccessToken(tenant, body.scopes);
                return {
                    token: token,
                    expires_in: this.configService.get('TOKEN_EXPIRATION_TIME'),
                    token_type: "bearer"
                };
            }
            default:
                throw new BadRequestException("grant type not recognised.");
        }
    }

    @Get('/verify/:token')
    async verify(
        @Param('token') token: string,
        @Response() response
    ): Promise<any> {
        const verified: boolean = await this.authService.verifyEmail(token);

        let link: any = this.configService.get('VERIFY_EMAIL_LINK');
        if (!link || link === '') {
            response.send({status: verified});
        } else {
            link += ((link.endsWith('/')) ? '' : '/') + token;
            response.redirect(link);
        }
    }

    @Post('/forgot-password')
    async forgotPassword(
        @Headers() headers,
        @Body(new ValidationPipe(ValidationSchema.ForgotPasswordSchema)) body: any
    ): Promise<object> {
        const user: User = await this.usersService.findByEmail(body.email);
        const token: string = await this.authService.createResetPasswordToken(user);

        let link: any = this.configService.get('RESET_PASSWORD_LINK');
        if (!link || link === '') {
            link += 'https://' + headers.host + '/reset-password/' + token;
        } else {
            link += ((link.endsWith('/')) ? '' : '/') + token;
        }

        const sent: boolean = await this.mailService.sendResetPasswordMail(user, link);
        if (!sent) {
            throw new MailServiceErrorException();
        }

        return {status: sent};
    }

    @Post('/reset-password/:token')
    async resetPassword(
        @Param('token') token: string,
        @Body(new ValidationPipe(ValidationSchema.ResetPasswordSchema)) body: any
    ): Promise<object> {
        const reset: boolean = await this.authService.resetPassword(token, body.password);
        return {status: reset};
    }

    @Get('/change-email/:token')
    async changeEmail(
        @Param('token') token: string,
        @Response() response
    ): Promise<any> {
        const confirmed: boolean = await this.authService.confirmEmailChange(token);

        let link: any = this.configService.get('CHANGE_EMAIL_LINK');
        if (!link || link === '') {
            response.send({status: confirmed});
        } else {
            response.redirect(link);
        }
    }
}
