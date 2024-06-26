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
import {Role} from "../roles/role.entity";
import {SecurityService} from "../roles/security.service";
import {RoleService} from "../roles/role.service";
import {Action} from "../roles/actions.enum";
import {ForbiddenException} from "../exceptions/forbidden.exception";
import {subject} from "@casl/ability";
import {SubjectEnum} from "../roles/subjectEnum";

@Controller('api/tenant')
@UseInterceptors(ClassSerializerInterceptor)
export class MemberController {

    constructor(
        private readonly configService: ConfigService,
        private readonly tenantService: TenantService,
        private readonly usersService: UsersService,
        private readonly roleService: RoleService,
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
        this.securityService.check(request, Action.Read, subject(SubjectEnum.TENANT, tenant));
        let members = await this.usersService.findByTenant(tenant);
        for (const member of members) {
            member.roles = await this.roleService.getMemberRoles(tenant, member);
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
        const isPresent = await this.usersService.existByEmail(email);
        if (!isPresent) {
            await this.usersService.createShadowUser(email, email);
        }
        const user = await this.usersService.findByEmail(email);
        const tenant = await this.tenantService.findById(tenantId);
        this.securityService.check(request, Action.Update, subject(SubjectEnum.TENANT, tenant));
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
        this.securityService.check(request, Action.Update, subject(SubjectEnum.TENANT, tenant));
        let securityContext = this.securityService.getUserSecurityContext(request);
        if (securityContext.email === email) {
            throw new ForbiddenException("cannot remove self");
        }
        return this.tenantService.removeMember(tenantId, user);
    }

    @Put('/:tenantId/member/:email/roles')
    @UseGuards(JwtAuthGuard)
    async updateRole(
        @Request() request,
        @Param('tenantId') tenantId: string,
        @Param('email') email: string,
        @Body(new ValidationPipe(ValidationSchema.OperatingRoleSchema)) body: { roles: string[] }
    ): Promise<Role[]> {
        const user = await this.usersService.findByEmail(email);
        let tenant = await this.tenantService.findById(tenantId);
        this.securityService.check(request, Action.Update, subject(SubjectEnum.TENANT, tenant));
        return this.tenantService.updateRolesOfMember(body.roles, tenantId, user);
    }

    @Get('/:tenantId/member/:email')
    @UseGuards(JwtAuthGuard)
    async getMember(
        @Request() request,
        @Param('tenantId') tenantId: string,
        @Param('email') email: string
    ): Promise<any> {
        const user = await this.usersService.findByEmail(email);
        const tenant = await this.tenantService.findById(tenantId);
        this.securityService.check(request, Action.Read, subject(SubjectEnum.TENANT, tenant));
        let roles = await this.tenantService.getMemberRoles(tenantId, user);
        return {
            tenantId: tenant.id,
            userId: user.id,
            roles: roles
        };
    }

    @Get('/:tenantId/member/:email/roles')
    @UseGuards(JwtAuthGuard)
    async getMemberRoles(
        @Request() request,
        @Param('tenantId') tenantId: string,
        @Param('email') email: string
    ): Promise<any> {
        const user = await this.usersService.findByEmail(email);
        const tenant = await this.tenantService.findById(tenantId);
        this.securityService.check(request, Action.Read, subject(SubjectEnum.TENANT, tenant));
        let roles = await this.tenantService.getMemberRoles(tenantId, user);
        return {
            roles: roles
        };
    }

}
