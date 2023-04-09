import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Get,
    Headers,
    Patch,
    Request,
    UseGuards,
    UseInterceptors
} from '@nestjs/common';

import {User} from '../users/user.entity';
import {UsersService} from '../users/users.service';
import {AuthService} from '../auth/auth.service';
import {MailService} from '../mail/mail.service';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';
import {ValidationPipe} from '../validation/validation.pipe';
import {ValidationSchema} from '../validation/validation.schema';
import {MailServiceErrorException} from '../exceptions/mail-service-error.exception';
import {TenantService} from "../tenants/tenant.service";
import {Tenant} from "../tenants/tenant.entity";
import {SecurityService} from "../scopes/security.service";

@Controller('api/users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly authService: AuthService,
        private readonly tenantService: TenantService,
        private readonly mailService: MailService,
        private readonly securityService: SecurityService
    ) {
    }

    @Get('/me')
    @UseGuards(JwtAuthGuard)
    async getMyUser(
        @Request() request
    ): Promise<User> {
        const securityContext = this.securityService.getSecurityContext(request);
        const user: User = await this.usersService.findByEmail(securityContext.email);
        return this.usersService.findById(user.id);
    }

    @Patch('/me/email')
    @UseGuards(JwtAuthGuard)
    async updateMyEmail(
        @Request() request,
        @Headers() headers,
        @Body(new ValidationPipe(ValidationSchema.UpdateMyEmailSchema)) body: any
    ): Promise<object> {
        const securityContext = this.securityService.getSecurityContext(request);
        const user: User = await this.usersService.findByEmail(securityContext.email);
        const token: string = await this.authService.createChangeEmailToken(user, body.email);
        const link: string = 'https://' + headers.host + '/change-email/' + token;

        const sent: boolean = await this.mailService.sendChangeEmailMail(body.email, link);
        if (!sent) {
            throw new MailServiceErrorException();
        }

        return {status: sent};
    }

    @Patch('/me/password')
    @UseGuards(JwtAuthGuard)
    async updateMyPassword(
        @Request() request,
        @Body(new ValidationPipe(ValidationSchema.UpdateMyPasswordSchema)) body: any
    ): Promise<User> {
        const securityContext = this.securityService.getSecurityContext(request);
        const user: User = await this.usersService.findByEmail(securityContext.email);
        return this.usersService.updatePasswordSecure(user.id, body.currentPassword, body.newPassword);
    }

    @Patch('/me/name')
    @UseGuards(JwtAuthGuard)
    async updateMyName(
        @Request() request,
        @Body(new ValidationPipe(ValidationSchema.UpdateMyNameSchema)) body: any
    ): Promise<User> {
        const securityContext = this.securityService.getSecurityContext(request);
        const user: User = await this.usersService.findByEmail(securityContext.email);
        return this.usersService.updateName(user.id, body.name);
    }

    @Get('/me/tenants')
    @UseGuards(JwtAuthGuard)
    async getTenants(
        @Request() request,
    ): Promise<Tenant[]> {
        const securityContext = this.securityService.getSecurityContext(request);
        const user: User = await this.usersService.findByEmail(securityContext.email);
        return this.tenantService.findByMembership(user);
    }
}
