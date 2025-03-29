import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Get,
    Headers,
    Patch,
    Post,
    Request,
    UseGuards,
    UseInterceptors
} from '@nestjs/common';

import {User} from '../entity/user.entity';
import {UsersService} from '../services/users.service';
import {AuthService} from '../auth/auth.service';
import {MailService} from '../mail/mail.service';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';
import {ValidationPipe} from '../validation/validation.pipe';
import {ValidationSchema} from '../validation/validation.schema';
import {MailServiceErrorException} from '../exceptions/mail-service-error.exception';
import {TenantService} from "../services/tenant.service";
import {Tenant} from "../entity/tenant.entity";
import {SecurityService} from "../casl/security.service";
import {EmailTakenException} from "../exceptions/email-taken.exception";
import * as argon2 from "argon2";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";

@Controller('api/users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly authService: AuthService,
        private readonly tenantService: TenantService,
        private readonly mailService: MailService,
        private readonly securityService: SecurityService,
        @InjectRepository(User) private usersRepository: Repository<User>,
    ) {
    }

    @Post('/signup')
    async signup(
        @Headers() headers,
        @Request() request,
        @Body(new ValidationPipe(ValidationSchema.SignUpSchema)) body: { name: string, password: string, email: string }
    ): Promise<User> {
        const existingUser = await this.usersRepository.findOne({where: {email: body.email}});
        if (existingUser) {
            throw new EmailTakenException();
        }

        const hashedPassword = await argon2.hash(body.password);
        let user = this.usersRepository.create({...body, password: hashedPassword});
        user = await this.usersRepository.save(user);

        const token = await this.authService.createVerificationToken(user);
        const link = `https://${headers.host}/api/oauth/verify-email/${token}`;

        const sent = await this.mailService.sendVerificationMail(user, link);
        if (!sent) {
            await this.usersRepository.remove(user);
            throw new MailServiceErrorException();
        }

        return user;
    }

    @Post('/signdown')
    @UseGuards(JwtAuthGuard)
    async signdown(
        @Request() request,
        @Body(new ValidationPipe(ValidationSchema.SignDownSchema)) body: { password: string }
    ): Promise<{ status: boolean }> {
        const securityContext = this.securityService.getUserToken(request);
        const user = await this.usersService.findByEmail(request, securityContext.email);
        await this.usersService.deleteSecure(request, user.id, body.password);
        return {status: true}
    }

    @Get('/me')
    @UseGuards(JwtAuthGuard)
    async getMyUser(@Request() request): Promise<User> {
        const securityContext = this.securityService.getUserToken(request);
        const user = await this.usersService.findByEmail(request, securityContext.email);
        return this.usersService.findById(request, user.id);
    }

    @Patch('/me/email')
    @UseGuards(JwtAuthGuard)
    async updateMyEmail(
        @Request() request,
        @Headers() headers,
        @Body(new ValidationPipe(ValidationSchema.UpdateMyEmailSchema)) body: any
    ): Promise<{ status: boolean }> {
        const securityContext = this.securityService.getUserToken(request);
        const user = await this.usersService.findByEmail(request, securityContext.email);
        const token = await this.authService.createChangeEmailToken(user, body.email);
        const link = `https://${headers.host}/api/oauth/change-email/${token}`;

        const sent = await this.mailService.sendChangeEmailMail(body.email, link);
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
    ): Promise<{ status: boolean }> {
        const securityContext = this.securityService.getUserToken(request);
        const user = await this.usersService.findByEmail(request, securityContext.email);
        await this.usersService.updatePasswordSecure(request, user.id, body.currentPassword, body.newPassword);
        return {status: true};
    }

    @Patch('/me/name')
    @UseGuards(JwtAuthGuard)
    async updateMyName(
        @Request() request,
        @Body(new ValidationPipe(ValidationSchema.UpdateMyNameSchema)) body: any
    ): Promise<User> {
        const securityContext = this.securityService.getUserToken(request);
        const user = await this.usersService.findByEmail(request, securityContext.email);
        return this.usersService.updateName(request, user.id, body.name);
    }

    @Get('/me/tenants')
    @UseGuards(JwtAuthGuard)
    async getTenants(@Request() request): Promise<Tenant[]> {
        const securityContext = this.securityService.getUserToken(request);
        const user = await this.usersService.findByEmail(request, securityContext.email);
        return this.tenantService.findByViewership(request, user);
    }
}
