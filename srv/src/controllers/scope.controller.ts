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
import {ScopeService} from "../scopes/scope.service";
import {Scope} from "../scopes/scope.entity";
import {SecurityService} from "../scopes/security.service";
import {Action} from "../scopes/actions.enum";

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
    @UseGuards(JwtAuthGuard)
    async createScope(
        @Request() request,
        @Param('tenantId') tenantId: string,
        @Param('name') name: string,
    ): Promise<Scope> {
        let tenant = await this.tenantService.findById(tenantId);
        this.securityService.check(request, Action.Update, tenant);
        return this.scopeService.create(
            name,
            tenant
        );
    }

    @Delete('/:tenantId/scope/:name')
    @UseGuards(JwtAuthGuard)
    async deleteScope(
        @Request() request,
        @Param('tenantId') tenantId: string,
        @Param('name') name: string,
    ): Promise<Scope> {
        let tenant = await this.tenantService.findById(tenantId);
        this.securityService.check(request, Action.Update, tenant);
        let scope = await this.scopeService.findByNameAndTenant(name, tenant);
        return await this.scopeService.deleteById(scope.id);
    }

    @Get('/:tenantId/scopes')
    @UseGuards(JwtAuthGuard)
    async getTenantScopes(
        @Request() request,
        @Param('tenantId') tenantId: string
    ): Promise<Scope[]> {
        const tenant = await this.tenantService.findById(tenantId);
        this.securityService.check(request, Action.Read, tenant);
        return this.tenantService.getTenantScopes(tenant)
    }


}
