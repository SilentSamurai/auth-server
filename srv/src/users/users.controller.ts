import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Delete,
    Get,
    Headers,
    Param,
    Patch,
    Post,
    Put,
    Request,
    UseGuards,
    UseInterceptors
} from '@nestjs/common';

import {User} from './user.entity';
import {UsersService} from './users.service';
import {AuthService} from '../auth/auth.service';
import {MailService} from '../mail/mail.service';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';
import {Roles} from '../roles/roles.decorator';
import {RoleEnum} from '../roles/role.enum';
import {RolesGuard} from '../roles/roles.guard';
import {ValidationPipe} from '../validation/validation.pipe';
import {ValidationSchema} from '../validation/validation.schema';
import {MailServiceErrorException} from '../exceptions/mail-service-error.exception';
import {TenantService} from "../tenants/tenant.service";
import {Tenant} from "../tenants/tenant.entity";

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly authService: AuthService,
        private readonly tenantService: TenantService,
        private readonly mailService: MailService
    ) {
    }

    @Post('/create')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.ADMIN) // SUPER ADMIN
    async createUser(
        @Body(new ValidationPipe(ValidationSchema.CreateUserSchema)) body: {
            name: string,
            email: string,
            password: string
        }
    ): Promise<User> {

        let user: User = await this.usersService.create(
            body.password,
            body.email,
            body.name
        );

        await this.usersService.updateVerified(user.id, true);
        return user;
    }

    @Put('/update')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.ADMIN) // SUPER ADMIN
    async updateUser(
        @Body(new ValidationPipe(ValidationSchema.UpdateUserSchema)) body: {
            id: string,
            name: string,
            email: string,
            password: string
        }
    ): Promise<User> {

        let user: User = await this.usersService.update(
            body.id,
            body.name,
            body.email,
            body.password,
        );

        return user;
    }

    @Get('/me')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.USER) // ANY SCOPE
    async getMyUser(
        @Request() request
    ): Promise<User> {
        const user: User = await this.usersService.findByEmail(request.user.email);
        return this.usersService.findById(user.id);
    }

    @Get('/:email')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.ADMIN) // SUPER ADMIN
    async getUser(
        @Param('email') email: string
    ): Promise<User> {
        const user: User = await this.usersService.findByEmail(email);
        return this.usersService.findById(user.id);
    }

    @Get('')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.ADMIN) // SUPER ADMIN
    async getUsers(): Promise<User[]> {
        return await this.usersService.getAll();
    }

    @Patch('/me/email')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.USER, RoleEnum.ADMIN) // ANY ROLE
    async updateMyEmail(
        @Request() request,
        @Headers() headers,
        @Body(new ValidationPipe(ValidationSchema.UpdateMyEmailSchema)) body: any
    ): Promise<object> {
        const user: User = await this.usersService.findByEmail(request.user.username);
        const token: string = await this.authService.createChangeEmailToken(user, body.email);
        const link: string = 'https://' + headers.host + '/change-email/' + token;

        const sent: boolean = await this.mailService.sendChangeEmailMail(body.email, link);
        if (!sent) {
            throw new MailServiceErrorException();
        }

        return {status: sent};
    }

    @Patch('/me/password')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.USER)
    async updateMyPassword(
        @Request() request,
        @Body(new ValidationPipe(ValidationSchema.UpdateMyPasswordSchema)) body: any
    ): Promise<User> {
        const user: User = await this.usersService.findByEmail(request.user.email);
        return this.usersService.updatePasswordSecure(user.id, body.currentPassword, body.newPassword);
    }

    @Patch('/me/name')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.USER)
    async updateMyName(
        @Request() request,
        @Body(new ValidationPipe(ValidationSchema.UpdateMyNameSchema)) body: any
    ): Promise<User> {
        const user: User = await this.usersService.findByEmail(request.user.email);
        return this.usersService.updateName(user.id, body.name);
    }

    @Delete('/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.ADMIN)
    async deleteUser(
        @Param('id') id: string
    ): Promise<User> {
        return await this.usersService.delete(id);
    }

    @Get('/:email/tenants')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.ADMIN)
    async getTenants(
        @Param('email') email: string
    ): Promise<Tenant[]> {
        const user: User = await this.usersService.findByEmail(email);
        return this.tenantService.findAllUserTenants(user);
    }
}
