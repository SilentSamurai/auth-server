import {
    ClassSerializerInterceptor,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Request,
    UseGuards,
    UseInterceptors
} from "@nestjs/common";
import {ConfigService} from "../config/config.service";
import {TenantService} from "../tenants/tenant.service";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {RoleService} from "../roles/role.service";
import {Role} from "../roles/role.entity";
import {SecurityService} from "../roles/security.service";
import {Action} from "../roles/actions.enum";
import {subject} from "@casl/ability";
import {SubjectEnum} from "../roles/subjectEnum";

@Controller('api/tenant')
@UseInterceptors(ClassSerializerInterceptor)
export class RoleController {

    constructor(
        private readonly configService: ConfigService,
        private readonly tenantService: TenantService,
        private readonly roleService: RoleService,
        private readonly securityService: SecurityService
    ) {
    }

    @Post('/:tenantId/role/:name')
    @UseGuards(JwtAuthGuard)
    async createRole(
        @Request() request,
        @Param('tenantId') tenantId: string,
        @Param('name') name: string,
    ): Promise<Role> {
        let tenant = await this.tenantService.findById(tenantId);
        this.securityService.check(request, Action.Update, subject(SubjectEnum.TENANT, tenant));
        return this.roleService.create(
            name,
            tenant
        );
    }

    @Delete('/:tenantId/role/:name')
    @UseGuards(JwtAuthGuard)
    async deleteRole(
        @Request() request,
        @Param('tenantId') tenantId: string,
        @Param('name') name: string,
    ): Promise<Role> {
        let tenant = await this.tenantService.findById(tenantId);
        this.securityService.check(request, Action.Update, subject(SubjectEnum.TENANT, tenant));
        let roles = await this.roleService.findByNameAndTenant(name, tenant);
        return await this.roleService.deleteById(roles.id);
    }

    @Get('/:tenantId/roles')
    @UseGuards(JwtAuthGuard)
    async getTenantRoles(
        @Request() request,
        @Param('tenantId') tenantId: string
    ): Promise<Role[]> {
        const tenant = await this.tenantService.findById(tenantId);
        this.securityService.check(request, Action.Read, subject(SubjectEnum.TENANT, tenant));
        return this.tenantService.getTenantRoles(tenant)
    }


}
