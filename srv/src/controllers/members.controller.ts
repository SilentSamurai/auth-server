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
import {User} from "../users/user.entity";
import {Scope} from "../scopes/scope.entity";
import {SecurityService} from "../scopes/security.service";
import {ScopeService} from "../scopes/scope.service";

@Controller('api/tenant')
@UseInterceptors(ClassSerializerInterceptor)
export class MemberController {

    constructor(
        private readonly configService: ConfigService,
        private readonly tenantService: TenantService,
        private readonly usersService: UsersService,
        private readonly scopeService: ScopeService,
        private readonly securityService: SecurityService
    ) {
    }

    @Get('/:tenantId/members')
    @UseGuards(JwtAuthGuard, ScopeGuard)
    @Scopes(ScopeEnum.TENANT_ADMIN, ScopeEnum.TENANT_VIEWER)
    async getTenantMembers(
        @Request() request,
        @Param('tenantId') tenantId: string
    ): Promise<User[]> {
        let tenant = await this.tenantService.findById(tenantId);
        await this.securityService.contextShouldBeTenantViewer(request, tenant.domain);
        let members = await this.usersService.findByTenant(tenant);
        for (const member of members) {
            member.scopes = await this.scopeService.getMemberScopes(tenant, member);
        }
        return members;
    }

    @Post('/:tenantId/member/:email')
    @UseGuards(JwtAuthGuard, ScopeGuard)
    @Scopes(ScopeEnum.TENANT_ADMIN)
    async addMember(
        @Request() request,
        @Param('tenantId') tenantId: string,
        @Param('email') email: string
    ): Promise<Tenant> {
        const user = await this.usersService.findByEmail(email);
        let tenant = await this.tenantService.findById(tenantId);
        await this.securityService.currentUserShouldBeTenantAdmin(request, tenant.domain);
        await this.tenantService.addMember(tenantId, user);
        return tenant;
    }

    @Delete('/:tenantId/member/:email')
    @UseGuards(JwtAuthGuard, ScopeGuard)
    @Scopes(ScopeEnum.TENANT_ADMIN)
    async removeMember(
        @Request() request,
        @Param('tenantId') tenantId: string,
        @Param('email') email: string
    ): Promise<Tenant> {
        const user = await this.usersService.findByEmail(email);
        let tenant = await this.tenantService.findById(tenantId);
        await this.securityService.currentUserShouldBeTenantAdmin(request, tenant.domain)
        return this.tenantService.removeMember(tenantId, user);
    }

    @Put('/:tenantId/member/:email/scope')
    @UseGuards(JwtAuthGuard, ScopeGuard)
    @Scopes(ScopeEnum.TENANT_ADMIN)
    async updateScope(
        @Request() request,
        @Param('tenantId') tenantId: string,
        @Param('email') email: string,
        @Body(new ValidationPipe(ValidationSchema.OperatingScopeSchema)) body: { scopes: string[] }
    ): Promise<Scope[]> {
        const user = await this.usersService.findByEmail(email);
        let tenant = await this.tenantService.findById(tenantId);
        await this.securityService.currentUserShouldBeTenantAdmin(request, tenant.domain)
        return this.tenantService.updateScopeOfMember(body.scopes, tenantId, user);
    }

}
