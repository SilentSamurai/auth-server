import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    UseGuards,
    UseInterceptors,
} from "@nestjs/common";
import * as yup from "yup";
import {Environment} from "../config/environment.service";
import {TenantService} from "../services/tenant.service";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {RoleService} from "../services/role.service";
import {Role} from "../entity/role.entity";
import {Action} from "../casl/actions.enum";
import {SubjectEnum} from "../entity/subjectEnum";
import {UsersService} from "../services/users.service";
import {CurrentPermission, CurrentTenantId, Permission} from "../auth/auth.decorator";
import {ValidationPipe} from "../validation/validation.pipe";

@Controller("api")
@UseInterceptors(ClassSerializerInterceptor)
export class RoleController {

    static UpdateRoleSchema = yup.object().shape({
        name: yup.string().optional(),
        description: yup.string().optional(),
        appId: yup.string().optional().nullable(),
    });

    constructor(
        private readonly configService: Environment,
        private readonly tenantService: TenantService,
        private readonly userService: UsersService,
        private readonly roleService: RoleService,
    ) {
    }

    // ─── V1 routes (token-derived, no :tenantId in URL) ───

    @Post("/tenant/my/role/:name")
    @UseGuards(JwtAuthGuard)
    async createMyRole(
        @CurrentPermission() permission: Permission,
        @CurrentTenantId() tenantId: string,
        @Param("name") name: string,
    ): Promise<Role> {
        return this._createRole(permission, tenantId, name);
    }

    @Delete("/tenant/my/role/:name")
    @UseGuards(JwtAuthGuard)
    async deleteMyRole(
        @CurrentPermission() permission: Permission,
        @CurrentTenantId() tenantId: string,
        @Param("name") name: string,
    ): Promise<Role> {
        return this._deleteRole(permission, tenantId, name);
    }

    @Get("/tenant/my/roles")
    @UseGuards(JwtAuthGuard)
    async getMyTenantRoles(
        @CurrentPermission() permission: Permission,
        @CurrentTenantId() tenantId: string,
    ): Promise<Role[]> {
        return this._getTenantRoles(permission, tenantId);
    }

    @Get("/tenant/my/role/:name")
    @UseGuards(JwtAuthGuard)
    async getMyRole(
        @CurrentPermission() permission: Permission,
        @CurrentTenantId() tenantId: string,
        @Param("name") name: string,
    ): Promise<any> {
        return this._getRoleWithUsers(permission, tenantId, name);
    }

    // ─── V2 routes ───

    @Patch("/role/:roleId")
    @UseGuards(JwtAuthGuard)
    async updateRoleDescription(
        @CurrentPermission() permission: Permission,
        @Param("roleId") roleId: string,
        @Body(new ValidationPipe(RoleController.UpdateRoleSchema))
        body: { name: string; description: string; appId?: string },
    ): Promise<Role> {
        return this.roleService.updateRole(permission, roleId, body.name, body.description, body.appId);
    }

    @Get("/role/:roleId")
    @UseGuards(JwtAuthGuard)
    async getRole(
        @CurrentPermission() permission: Permission,
        @Param("roleId") roleId: string,
    ): Promise<any> {
        const role = await this.roleService.findById(permission, roleId);
        permission.isAuthorized(Action.Read, SubjectEnum.TENANT, role.tenant);
        const users = await this.userService.findByRole(permission, role);
        return {role, users};
    }

    // ─── Shared implementation methods ───

    private async _createRole(permission: Permission, tenantId: string, name: string): Promise<Role> {
        const tenant = await this.tenantService.findById(permission, tenantId);
        permission.isAuthorized(Action.Update, SubjectEnum.TENANT, tenant);
        return this.roleService.create(permission, name, tenant);
    }

    private async _deleteRole(permission: Permission, tenantId: string, name: string): Promise<Role> {
        const tenant = await this.tenantService.findById(permission, tenantId);
        permission.isAuthorized(Action.Update, SubjectEnum.TENANT, tenant);
        const role = await this.roleService.findByNameAndTenant(permission, name, tenant);
        return this.roleService.deleteById(permission, role.id);
    }

    private async _getTenantRoles(permission: Permission, tenantId: string): Promise<Role[]> {
        const tenant = await this.tenantService.findById(permission, tenantId);
        return this.tenantService.getTenantRoles(permission, tenant);
    }

    private async _getRoleWithUsers(permission: Permission, tenantId: string, name: string): Promise<any> {
        const tenant = await this.tenantService.findById(permission, tenantId);
        permission.isAuthorized(Action.Read, SubjectEnum.TENANT, tenant);
        const role = await this.roleService.findByNameAndTenant(permission, name, tenant);
        const users = await this.userService.findByRole(permission, role);
        return {role, users};
    }
}
