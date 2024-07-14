import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Request,
    UseGuards,
    UseInterceptors
} from '@nestjs/common';

import {User} from '../entity/user.entity';
import {UsersService} from '../services/users.service';
import {AuthService} from '../auth/auth.service';
import {MailService} from '../mail/mail.service';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';
import {RoleRule, Rules} from '../casl/roles.decorator';
import {RoleGuard} from '../auth/role.guard';
import {ValidationPipe} from '../validation/validation.pipe';
import {ValidationSchema} from '../validation/validation.schema';
import {TenantService} from "../services/tenant.service";
import {Tenant} from "../entity/tenant.entity";
import {Action} from "../entity/actions.enum";
import {SubjectEnum} from "../entity/subjectEnum";
import {SecurityService} from "../casl/security.service";


@Controller('api/users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersAdminController {
    constructor(
        private readonly usersService: UsersService,
        private readonly authService: AuthService,
        private readonly tenantService: TenantService,
        private readonly mailService: MailService,
        private readonly securityService: SecurityService
    ) {
    }

    @Post('/create')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Rules(
        RoleRule.can(Action.Create, SubjectEnum.USER),
    )
    async createUser(
        @Request() request,
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

        await this.usersService.updateVerified(request, user.id, true);
        return user;
    }

    @Put('/update')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Rules(
        RoleRule.can(Action.Update, SubjectEnum.USER),
    )
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


    @Get('/:userId')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Rules(
        RoleRule.can(Action.Read, SubjectEnum.USER),
    )
    async getUser(
        @Param('userId') userId: string
    ): Promise<any> {
        const user: User = await this.usersService.findById(userId);

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
            verified: user.verified,
        };
    }

    @Get('')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Rules(
        RoleRule.can(Action.Manage, SubjectEnum.USER),
    )
    async getUsers(): Promise<User[]> {
        return await this.usersService.getAll();
    }

    @Delete('/:id')
    @UseGuards(JwtAuthGuard)
    async deleteUser(
        @Request() request,
        @Param('id') id: string
    ): Promise<User> {
        return await this.usersService.delete(request, id);
    }

    @Get('/:userId/tenants')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Rules(
        RoleRule.can(Action.Read, SubjectEnum.USER),
    )
    async getTenants(
        @Param('userId') userId: string
    ): Promise<Tenant[]> {
        const user: User = await this.usersService.findById(userId);
        return this.tenantService.findByMembership(user);
    }

    @Put('/verify-user')
    @UseGuards(JwtAuthGuard)
    async updateVerification(
        @Request() request,
        @Body(new ValidationPipe(ValidationSchema.verifyUser)) body: {
            email: string,
            verify: boolean
        }
    ): Promise<User> {
        let user: User = await this.usersService.findByEmail(body.email);

        return await this.usersService.updateVerified(request, user.id, body.verify);
    }

}
