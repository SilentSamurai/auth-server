import {
    ClassSerializerInterceptor,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Request,
    UseGuards,
    UseInterceptors,
} from "@nestjs/common";
import {Environment} from "../config/environment.service";
import {TenantService} from "../services/tenant.service";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {RoleService} from "../services/role.service";
import {Role} from "../entity/role.entity";
import {SecurityService} from "../casl/security.service";
import {Action} from "../casl/actions.enum";
import {subject} from "@casl/ability";
import {SubjectEnum} from "../entity/subjectEnum";
import {UsersService} from "../services/users.service";

@Controller("api/tenant")
@UseInterceptors(ClassSerializerInterceptor)
export class RoleController {
    constructor(
        private readonly configService: Environment,
        private readonly tenantService: TenantService,
        private readonly userService: UsersService,
        private readonly roleService: RoleService,
        private readonly securityService: SecurityService,
    ) {
    }

    @Post("/:tenantId/role/:name")
    @UseGuards(JwtAuthGuard)
    async createRole(
        @Request() request,
        @Param("tenantId") tenantId: string,
        @Param("name") name: string,
    ): Promise<Role> {
        let tenant = await this.tenantService.findById(request, tenantId);
        this.securityService.check(
            request,
            Action.Update,
            subject(SubjectEnum.TENANT, tenant),
        );
        return this.roleService.create(request, name, tenant);
    }

    @Delete("/:tenantId/role/:name")
    @UseGuards(JwtAuthGuard)
    async deleteRole(
        @Request() request,
        @Param("tenantId") tenantId: string,
        @Param("name") name: string,
    ): Promise<Role> {
        let tenant = await this.tenantService.findById(request, tenantId);
        this.securityService.check(
            request,
            Action.Update,
            subject(SubjectEnum.TENANT, tenant),
        );
        let roles = await this.roleService.findByNameAndTenant(
            request,
            name,
            tenant,
        );
        return await this.roleService.deleteById(request, roles.id);
    }

    @Get("/:tenantId/roles")
    @UseGuards(JwtAuthGuard)
    async getTenantRoles(
        @Request() request,
        @Param("tenantId") tenantId: string,
    ): Promise<Role[]> {
        const tenant = await this.tenantService.findById(request, tenantId);
        return this.tenantService.getTenantRoles(request, tenant);
    }

    @Get("/:tenantId/role/:name")
    @UseGuards(JwtAuthGuard)
    async getRole(
        @Request() request,
        @Param("tenantId") tenantId: string,
        @Param("name") name: string,
    ): Promise<any> {
        const tenant = await this.tenantService.findById(request, tenantId);
        this.securityService.check(
            request,
            Action.Read,
            subject(SubjectEnum.TENANT, tenant),
        );
        let role = await this.roleService.findByNameAndTenant(
            request,
            name,
            tenant,
        );
        let users = await this.userService.findByRole(request, role);
        return {
            role: role,
            users: users,
        };
    }
}
