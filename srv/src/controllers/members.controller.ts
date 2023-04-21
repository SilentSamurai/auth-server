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
import {User} from "../users/user.entity";
import {Scope} from "../scopes/scope.entity";
import {SecurityService} from "../scopes/security.service";
import {ScopeService} from "../scopes/scope.service";
import {Action} from "../scopes/actions.enum";
import {ForbiddenException} from "../exceptions/forbidden.exception";

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
    @UseGuards(JwtAuthGuard)
    async getTenantMembers(
        @Request() request,
        @Param('tenantId') tenantId: string
    ): Promise<User[]> {
        let tenant = await this.tenantService.findById(tenantId);
        this.securityService.check(request, Action.Read, tenant);
        let members = await this.usersService.findByTenant(tenant);
        for (const member of members) {
            member.scopes = await this.scopeService.getMemberScopes(tenant, member);
        }
        return members;
    }

    @Post('/:tenantId/member/:email')
    @UseGuards(JwtAuthGuard)
    async addMember(
        @Request() request,
        @Param('tenantId') tenantId: string,
        @Param('email') email: string
    ): Promise<Tenant> {
        const user = await this.usersService.findByEmail(email);
        const tenant = await this.tenantService.findById(tenantId);
        this.securityService.check(request, Action.Update, tenant);
        await this.tenantService.addMember(tenantId, user);
        return tenant;
    }

    @Delete('/:tenantId/member/:email')
    @UseGuards(JwtAuthGuard)
    async removeMember(
        @Request() request,
        @Param('tenantId') tenantId: string,
        @Param('email') email: string
    ): Promise<Tenant> {
        const user = await this.usersService.findByEmail(email);
        let tenant = await this.tenantService.findById(tenantId);
        this.securityService.check(request, Action.Update, tenant);
        let securityContext = this.securityService.getUserSecurityContext(request);
        if (securityContext.email === email) {
            throw new ForbiddenException("cannot remove self");
        }
        return this.tenantService.removeMember(tenantId, user);
    }

    @Put('/:tenantId/member/:email/scope')
    @UseGuards(JwtAuthGuard)
    async updateScope(
        @Request() request,
        @Param('tenantId') tenantId: string,
        @Param('email') email: string,
        @Body(new ValidationPipe(ValidationSchema.OperatingScopeSchema)) body: { scopes: string[] }
    ): Promise<Scope[]> {
        const user = await this.usersService.findByEmail(email);
        let tenant = await this.tenantService.findById(tenantId);
        this.securityService.check(request, Action.Update, tenant);
        return this.tenantService.updateScopeOfMember(body.scopes, tenantId, user);
    }

}
