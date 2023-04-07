import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Delete,
    Get,
    Headers,
    Param,
    Post,
    UseGuards,
    UseInterceptors
} from "@nestjs/common";
import {ConfigService} from "../config/config.service";
import {UsersService} from "../users/users.service";
import {TenantService} from "./tenant.service";
import {ValidationPipe} from "../validation/validation.pipe";
import {ValidationSchema} from "../validation/validation.schema";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {RolesGuard} from "../roles/roles.guard";
import {Roles} from "../roles/roles.decorator";
import {RoleEnum} from "../roles/role.enum";
import {ScopeService} from "./scope.service";
import {Scope} from "./scope.entity";
import {User} from "../users/user.entity";

@Controller('scope')
@UseInterceptors(ClassSerializerInterceptor)
export class ScopeController {

    constructor(
        private readonly configService: ConfigService,
        private readonly tenantService: TenantService,
        private readonly scopeService: ScopeService,
        private readonly usersService: UsersService
    ) {
    }

    @Post('/create')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.ADMIN)
    async createScope(
        @Headers() headers,
        @Body(new ValidationPipe(ValidationSchema.CreateScopeSchema)) body: { name: string, tenantId: string }
    ): Promise<Scope> {
        const tenant = await this.tenantService.findById(body.tenantId);
        return this.scopeService.create(
            body.name,
            tenant
        );
    }

    @Get('/:tenantId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.ADMIN)
    async getTenantScopes(
        @Param('tenantId') tenantId: string
    ): Promise<Scope[]> {
        const tenant = await this.tenantService.findById(tenantId);
        return this.scopeService.getTenantScopes(tenant)
    }

    @Delete('/delete')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.ADMIN)
    async deleteScope(
        @Headers() headers,
        @Body(new ValidationPipe(ValidationSchema.CreateScopeSchema)) body: { name: string, tenantId: string }
    ): Promise<Scope> {
        const tenant = await this.tenantService.findById(body.tenantId);
        return await this.scopeService.deleteByName(body.name, tenant);
    }

    @Post('/member')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.ADMIN)
    async addScope(
        @Headers() headers,
        @Body(new ValidationPipe(ValidationSchema.OperatingScopeSchema)) body:
            { email: string, name: string, tenantId: string }
    ): Promise<User> {
        const tenant = await this.tenantService.findById(body.tenantId);
        const user = await this.usersService.findByEmail(body.email);
        return this.scopeService.assignScopeToUser(body.name, tenant, user);
    }

    @Delete('/member')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.ADMIN)
    async removeScope(
        @Headers() headers,
        @Body(new ValidationPipe(ValidationSchema.OperatingScopeSchema)) body:
            { email: string, name: string, tenantId: string }
    ): Promise<User> {
        const tenant = await this.tenantService.findById(body.tenantId);
        const user = await this.usersService.findByEmail(body.email);
        return this.scopeService.removeScopeFromUser(body.name, tenant, user);
    }


}
