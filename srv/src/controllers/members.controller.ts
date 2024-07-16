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
import {UsersService} from "../services/users.service";
import {TenantService} from "../services/tenant.service";
import {ValidationPipe} from "../validation/validation.pipe";
import {ValidationSchema} from "../validation/validation.schema";
import {Tenant} from "../entity/tenant.entity";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {User} from "../entity/user.entity";
import {Role} from "../entity/role.entity";
import {SecurityService} from "../casl/security.service";
import {RoleService} from "../services/role.service";
import {Action} from "../entity/actions.enum";
import {ForbiddenException} from "../exceptions/forbidden.exception";
import {subject} from "@casl/ability";
import {SubjectEnum} from "../entity/subjectEnum";

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
        let tenant = await this.tenantService.findById(request, tenantId);
        this.securityService.check(request, Action.Read, subject(SubjectEnum.TENANT, tenant));
        let members = await this.usersService.findByTenant(request, tenant);
        for (const member of members) {
            member.roles = await this.roleService.getMemberRoles(request, tenant, member);
        }
        return members;
    }

    @Post('/:tenantId/members/add')
    @UseGuards(JwtAuthGuard)
    async addMember(
        @Request() request,
        @Param('tenantId') tenantId: string,
        @Body(new ValidationPipe(ValidationSchema.AddMemberSchema)) body: { emails: string[] }
    ): Promise<Tenant> {
        const tenant = await this.tenantService.findById(request, tenantId);
        this.securityService.check(request, Action.Update, subject(SubjectEnum.TENANT, tenant));
        for (const email of body.emails) {
            const isPresent = await this.usersService.existByEmail(request, email);
            if (!isPresent) {
                await this.usersService.createShadowUser(request, email, email);
            }
            const user = await this.usersService.findByEmail(request, email);
            await this.tenantService.addMember(request, tenant.id, user);
        }
        return tenant;
    }

    @Delete('/:tenantId/members/delete')
    @UseGuards(JwtAuthGuard)
    async removeMember(
        @Request() request,
        @Param('tenantId') tenantId: string,
        @Body(new ValidationPipe(ValidationSchema.AddMemberSchema)) body: { emails: string[] }
    ): Promise<Tenant> {
        let tenant = await this.tenantService.findById(request, tenantId);
        this.securityService.check(request, Action.Update, subject(SubjectEnum.TENANT, tenant));
        for (const email of body.emails) {
            const user = await this.usersService.findByEmail(request, email);
            let securityContext = this.securityService.getUserToken(request);
            if (securityContext.email === email) {
                throw new ForbiddenException("cannot remove self");
            }
            return this.tenantService.removeMember(request, tenantId, user);
        }
    }

    @Put('/:tenantId/member/:userId/casl')
    @UseGuards(JwtAuthGuard)
    async updateRole(
        @Request() request,
        @Param('tenantId') tenantId: string,
        @Param('userId') userId: string,
        @Body(new ValidationPipe(ValidationSchema.OperatingRoleSchema)) body: { roles: string[] }
    ): Promise<Role[]> {
        const user = await this.usersService.findById(request, userId);
        let tenant = await this.tenantService.findById(request, tenantId);
        this.securityService.check(request, Action.Update, subject(SubjectEnum.TENANT, tenant));
        return this.tenantService.updateRolesOfMember(request, body.roles, tenantId, user);
    }

    @Get('/:tenantId/member/:userId')
    @UseGuards(JwtAuthGuard)
    async getMember(
        @Request() request,
        @Param('tenantId') tenantId: string,
        @Param('userId') userId: string
    ): Promise<any> {
        const user = await this.usersService.findById(request, userId);
        const tenant = await this.tenantService.findById(request, tenantId);
        this.securityService.check(request, Action.Read, subject(SubjectEnum.TENANT, tenant));
        let roles = await this.tenantService.getMemberRoles(request, tenantId, user);
        return {
            tenantId: tenant.id,
            userId: user.id,
            roles: roles
        };
    }

    @Get('/:tenantId/member/:userId/casl')
    @UseGuards(JwtAuthGuard)
    async getMemberRoles(
        @Request() request,
        @Param('tenantId') tenantId: string,
        @Param('userId') userId: string
    ): Promise<any> {
        const user = await this.usersService.findByEmail(request, userId);
        const tenant = await this.tenantService.findById(request, tenantId);
        this.securityService.check(request, Action.Read, subject(SubjectEnum.TENANT, tenant));
        let roles = await this.tenantService.getMemberRoles(request, tenantId, user);
        return {
            roles: roles
        };
    }

}
