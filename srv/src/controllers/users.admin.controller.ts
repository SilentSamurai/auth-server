import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    UseGuards,
    UseInterceptors
} from '@nestjs/common';

import {User} from '../users/user.entity';
import {UsersService} from '../users/users.service';
import {AuthService} from '../auth/auth.service';
import {MailService} from '../mail/mail.service';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';
import {Scopes} from '../scopes/scopes.decorator';
import {ScopeEnum} from '../scopes/scope.enum';
import {ScopeGuard} from '../scopes/scope.guard';
import {ValidationPipe} from '../validation/validation.pipe';
import {ValidationSchema} from '../validation/validation.schema';
import {TenantService} from "../tenants/tenant.service";
import {Tenant} from "../tenants/tenant.entity";

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersAdminController {
    constructor(
        private readonly usersService: UsersService,
        private readonly authService: AuthService,
        private readonly tenantService: TenantService,
        private readonly mailService: MailService
    ) {
    }

    @Post('/create')
    @UseGuards(JwtAuthGuard, ScopeGuard)
    @Scopes(ScopeEnum.SUPER_ADMIN) // SUPER ADMIN
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
    @UseGuards(JwtAuthGuard, ScopeGuard)
    @Scopes(ScopeEnum.SUPER_ADMIN) // SUPER ADMIN
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


    @Get('/:email')
    @UseGuards(JwtAuthGuard, ScopeGuard)
    @Scopes(ScopeEnum.SUPER_ADMIN) // SUPER ADMIN
    async getUser(
        @Param('email') email: string
    ): Promise<User> {
        const user: User = await this.usersService.findByEmail(email);
        return this.usersService.findById(user.id);
    }

    @Get('')
    @UseGuards(JwtAuthGuard, ScopeGuard)
    @Scopes(ScopeEnum.SUPER_ADMIN) // SUPER ADMIN
    async getUsers(): Promise<User[]> {
        return await this.usersService.getAll();
    }

    @Delete('/:id')
    @UseGuards(JwtAuthGuard, ScopeGuard)
    @Scopes(ScopeEnum.SUPER_ADMIN)
    async deleteUser(
        @Param('id') id: string
    ): Promise<User> {
        return await this.usersService.delete(id);
    }

    @Get('/:email/tenants')
    @UseGuards(JwtAuthGuard, ScopeGuard)
    @Scopes(ScopeEnum.SUPER_ADMIN)
    async getTenants(
        @Param('email') email: string
    ): Promise<Tenant[]> {
        const user: User = await this.usersService.findByEmail(email);
        return this.tenantService.findByMembership(user);
    }
}
