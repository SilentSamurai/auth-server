import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Delete,
    Get,
    Headers,
    Param,
    Patch,
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

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly authService: AuthService,
        private readonly mailService: MailService
    ) {
    }

    @Get('/me')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.USER)
    async getMyUser(
        @Request() request
    ): Promise<User> {
        const user: User = await this.usersService.findByEmail(request.user.email);
        return this.usersService.findById(user.id);
    }

    @Get('/:email')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.ADMIN)
    async getUser(
        @Param('email') email: string
    ): Promise<User> {
        const user: User = await this.usersService.findByEmail(email);
        return this.usersService.findById(user.id);
    }

    @Get('')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.ADMIN)
    async getUsers(): Promise<User[]> {
        return await this.usersService.getAll();
    }

    @Patch('/me/email')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.USER, RoleEnum.ADMIN)
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

    @Patch('/:email/name')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.ADMIN)
    async updateName(
        @Param('email') email: string,
        @Body(new ValidationPipe(ValidationSchema.UpdateNameSchema)) body: any
    ): Promise<User> {
        const user: User = await this.usersService.findByEmail(email);
        return this.usersService.updateName(user.id, body.name);
    }

    @Delete('/:email')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.ADMIN)
    async deleteUser(
        @Param('email') email: string,
        @Body(new ValidationPipe(ValidationSchema.DeleteUserSchema)) body: any
    ): Promise<User> {
        const user: User = await this.usersService.findByEmail(email);
        return await this.usersService.delete(user.id);
    }
}
