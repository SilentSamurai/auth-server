import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Get,
    Headers,
    Param,
    Post,
    Request,
    Response,
    UseGuards,
    UseInterceptors
} from '@nestjs/common';

import {User} from '../users/user.entity';
import {ConfigService} from '../config/config.service';
import {AuthService} from './auth.service';
import {UsersService} from '../users/users.service';
import {MailService} from '../mail/mail.service';
import {JwtAuthGuard} from './jwt-auth.guard';
import {Roles} from '../roles/roles.decorator';
import {RoleEnum} from '../roles/role.enum';
import {RolesGuard} from '../roles/roles.guard';
import {ValidationPipe} from '../validation/validation.pipe';
import {ValidationSchema} from '../validation/validation.schema';
import {MailServiceErrorException} from '../exceptions/mail-service-error.exception';
import {LocalAuthGuard} from "./local-auth.guard";
import {TenantService} from "../tenants/tenant.service";

@Controller('oauth')
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

    @Post('/signup')
    async signup(
        @Headers() headers,
        @Body(new ValidationPipe(ValidationSchema.SignUpSchema)) body: any
    ): Promise<User> {
        const user: User = await this.usersService.create(
            body.password,
            body.email,
            body.name,
        );

        const token: string = await this.authService.createVerificationToken(user);
        const link: string = 'https://' + headers.host + '/verify/' + token;

        const sent: boolean = await this.mailService.sendVerificationMail(user, link);
        if (!sent) {
            this.usersService.delete(user.id);
            throw new MailServiceErrorException();
        }

        return user;
    }

    @Post('/signdown')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.USER)
    async signdown(
        @Request() request,
        @Body(new ValidationPipe(ValidationSchema.SignDownSchema)) body: any
    ): Promise<User> {
        const user: User = await this.usersService.deleteSecure(request.user.id, body.password);
        return user;
    }

    @Post('/signin')
    @UseGuards(LocalAuthGuard)
    async signin(
        @Request() request,
        @Body(new ValidationPipe(ValidationSchema.SignInSchema)) body: {
            email: string,
            password: string,
            domain: string
        }
    ): Promise<object> {
        const tenant = await this.tenantService.findByDomain(body.domain);
        const token: string = await this.authService.createAccessToken(request.user, tenant);
        return {token: token, user: request.user};
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
