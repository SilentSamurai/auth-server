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
import {ScopeGuard} from "../scopes/scope.guard";
import {Scopes} from "../scopes/scopes.decorator";
import {ScopeEnum} from "../scopes/scope.enum";
import {ScopeService} from "../scopes/scope.service";
import {Scope} from "../scopes/scope.entity";
import {SecurityService} from "../scopes/security.service";

@Controller('api/tenant')
@UseInterceptors(ClassSerializerInterceptor)
export class ScopeController {

    constructor(
        private readonly configService: ConfigService,
        private readonly tenantService: TenantService,
        private readonly scopeService: ScopeService,
        private readonly securityService: SecurityService
    ) {
    }

    @Post('/:tenantId/scope/:name')
    @UseGuards(JwtAuthGuard, ScopeGuard)
    @Scopes(ScopeEnum.TENANT_ADMIN)
    async createScope(
        @Request() request,
        @Param('tenantId') tenantId: string,
        @Param('name') name: string,
    ): Promise<Scope> {
        let tenant = await this.tenantService.findById(tenantId);
        await this.securityService.currentUserShouldBeTenantAdmin(request, tenant.domain)
        return this.scopeService.create(
            name,
            tenant
        );
    }

    @Delete('/:tenantId/scope/:name')
    @UseGuards(JwtAuthGuard, ScopeGuard)
    @Scopes(ScopeEnum.TENANT_ADMIN)
    async deleteScope(
        @Request() request,
        @Param('tenantId') tenantId: string,
        @Param('name') name: string,
    ): Promise<Scope> {
        let tenant = await this.tenantService.findById(tenantId);
        await this.securityService.currentUserShouldBeTenantAdmin(request, tenant.domain)
        let scope = await this.scopeService.findByNameAndTenant(name, tenant);
        return await this.scopeService.deleteById(scope.id);
    }

    @Get('/:tenantId/scopes')
    @UseGuards(JwtAuthGuard, ScopeGuard)
    @Scopes(ScopeEnum.TENANT_ADMIN, ScopeEnum.TENANT_VIEWER)
    async getTenantScopes(
        @Request() request,
        @Param('tenantId') tenantId: string
    ): Promise<Scope[]> {
        const tenant = await this.tenantService.findById(tenantId);
        await this.securityService.contextShouldBeTenantViewer(request, tenant.domain)
        return this.tenantService.getTenantScopes(tenant)
    }


}
