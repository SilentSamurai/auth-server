import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Delete,
    Get,
    Headers,
    Param,
    Post,
    Put,
    Request,
    UseGuards,
    UseInterceptors
} from "@nestjs/common";
import {ConfigService} from "../config/config.service";
import {UsersService} from "../users/users.service";
import {TenantService} from "./tenant.service";
import {ValidationPipe} from "../validation/validation.pipe";
import {ValidationSchema} from "../validation/validation.schema";
import {Tenant} from "./tenant.entity";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {RolesGuard} from "../roles/roles.guard";
import {Roles} from "../roles/roles.decorator";
import {RoleEnum} from "../roles/role.enum";
import {User} from "../users/user.entity";
import {Scope} from "./scope.entity";

@Controller('tenant')
@UseInterceptors(ClassSerializerInterceptor)
export class TenantController {

    constructor(
        private readonly configService: ConfigService,
        private readonly tenantService: TenantService,
        private readonly usersService: UsersService
    ) {
    }

    @Post('/create')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.ADMIN)
    async createTenant(
        @Request() request,
        @Body(new ValidationPipe(ValidationSchema.CreateTenantSchema)) body: any
    ): Promise<Tenant> {
        const user = await this.usersService.findByEmail(request.user.email);
        const tenant: Tenant = await this.tenantService.create(
            body.name,
            body.domain,
            user
        );
        return tenant;
    }

    @Get('')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.ADMIN)
    async getUsers(): Promise<Tenant[]> {
        return await this.tenantService.getAllTenants();
    }

    @Put('/update')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.ADMIN)
    async updateTenant(
        @Headers() headers,
        @Body(new ValidationPipe(ValidationSchema.UpdateTenantSchema)) body: any
    ): Promise<Tenant> {
        const tenant: Tenant = await this.tenantService.updateTenant(
            body.id,
            body.name,
            body.domain
        );

        return tenant;
    }

    @Delete('/:tenantId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.ADMIN)
    async deleteTenant(
        @Param('tenantId') tenantId: string
    ): Promise<Tenant> {
        return this.tenantService.deleteTenant(tenantId);
    }

    @Get('/:tenantId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.ADMIN)
    async getTenant(
        @Param('tenantId') tenantId: string
    ): Promise<Tenant> {
        return this.tenantService.findById(tenantId);
    }

    @Get('/:tenantId/members')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.ADMIN)
    async getTenantMembers(
        @Param('tenantId') tenantId: string
    ): Promise<User[]> {
        let tenant = await this.tenantService.findById(tenantId);
        return this.usersService.findByTenant(tenant);
    }

    @Post('/member')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.ADMIN)
    async addMember(
        @Headers() headers,
        @Body(new ValidationPipe(ValidationSchema.MemberOperationsSchema)) body:
            { tenantId: string, email: string }
    ): Promise<Tenant> {
        const user = await this.usersService.findByEmail(body.email);
        return this.tenantService.addMember(body.tenantId, user);
    }

    @Delete('/:tenantId/member/:email')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.ADMIN)
    async removeMember(
        @Param('tenantId') tenantId: string,
        @Param('email') email: string
    ): Promise<Tenant> {
        const user = await this.usersService.findByEmail(email);
        return this.tenantService.removeMember(tenantId, user);
    }

    @Get('/:tenantId/scopes')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.ADMIN)
    async getTenantScopes(
        @Param('tenantId') tenantId: string
    ): Promise<Scope[]> {
        const tenant = await this.tenantService.findById(tenantId);
        return this.tenantService.getTenantScopes(tenant)
    }

}
