import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Request,
    UseGuards,
    UseInterceptors
} from "@nestjs/common";
import {ConfigService} from "../config/config.service";
import {UsersService} from "../users/users.service";
import {TenantService} from "../tenants/tenant.service";
import {ValidationPipe} from "../validation/validation.pipe";
import {ValidationSchema} from "../validation/validation.schema";
import {Tenant} from "../tenants/tenant.entity";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {ScopeGuard} from "../scopes/scope.guard";
import {Scopes} from "../scopes/scopes.decorator";
import {ScopeEnum} from "../scopes/scope.enum";
import {GRANT_TYPES, SecurityService} from "../scopes/security.service";

@Controller('api/tenant')
@UseInterceptors(ClassSerializerInterceptor)
export class TenantController {

    constructor(
        private readonly configService: ConfigService,
        private readonly tenantService: TenantService,
        private readonly usersService: UsersService,
        private readonly securityService: SecurityService
    ) {
    }

    @Post('/create')
    @UseGuards(JwtAuthGuard, ScopeGuard)
    @Scopes(ScopeEnum.SUPER_ADMIN)
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

    @Patch('/:tenantId')
    @UseGuards(JwtAuthGuard, ScopeGuard)
    @Scopes(ScopeEnum.SUPER_ADMIN, ScopeEnum.TENANT_ADMIN)
    async updateTenant(
        @Request() request,
        @Param('tenantId') tenantId: string,
        @Body(new ValidationPipe(ValidationSchema.UpdateTenantSchema)) body: { name: string, domain: string }
    ): Promise<Tenant> {
        let tenant = await this.tenantService.findById(tenantId);
        await this.securityService.currentUserShouldBeTenantAdmin(request, tenant.domain)
        return this.tenantService.updateTenant(
            tenantId,
            body.name,
            body.domain
        );

    }

    @Delete('/:tenantId')
    @UseGuards(JwtAuthGuard, ScopeGuard)
    @Scopes(ScopeEnum.SUPER_ADMIN)
    async deleteTenant(
        @Param('tenantId') tenantId: string
    ): Promise<Tenant> {
        return this.tenantService.deleteTenant(tenantId);
    }

    @Get('')
    @UseGuards(JwtAuthGuard, ScopeGuard)
    @Scopes(ScopeEnum.SUPER_ADMIN)
    async getTenants(): Promise<Tenant[]> {
        return await this.tenantService.getAllTenants();
    }

    @Get('/:tenantId/credentials')
    @UseGuards(JwtAuthGuard, ScopeGuard)
    @Scopes(ScopeEnum.TENANT_VIEWER, ScopeEnum.TENANT_ADMIN)
    async getTenantCredentials(
        @Request() request,
        @Param('tenantId') tenantId: string
    ): Promise<any> {
        let securityContext = this.securityService.getUserOrTechnicalSecurityContext(request);
        if (tenantId === "my") {
            tenantId = securityContext.tenant.id;
        }
        let tenant = await this.tenantService.findById(tenantId);
        if (securityContext.grant_type === GRANT_TYPES.CLIENT_CREDENTIAL) {
            await this.securityService.contextShouldBeTenantViewer(request, tenant.domain);
        } else if (securityContext.grant_type === GRANT_TYPES.PASSWORD) {
            await this.securityService.currentUserShouldBeTenantAdmin(request, tenant.domain)
        }
        return {
            id: tenant.id,
            clientId: tenant.clientId,
            clientSecret: tenant.clientSecret,
            publicKey: tenant.publicKey
        };
    }

    @Get('/:tenantId')
    @UseGuards(JwtAuthGuard, ScopeGuard)
    @Scopes(ScopeEnum.TENANT_ADMIN, ScopeEnum.TENANT_VIEWER)
    async getTenant(
        @Request() request,
        @Param('tenantId') tenantId: string
    ): Promise<Tenant> {
        let tenant = await this.tenantService.findById(tenantId);
        await this.securityService.contextShouldBeTenantViewer(request, tenant.domain);
        return tenant;
    }


}
