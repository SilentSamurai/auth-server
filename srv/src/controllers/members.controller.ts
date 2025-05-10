import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Delete,
    ForbiddenException,
    Get,
    Param,
    Post,
    Put,
    Request,
    UseGuards,
    UseInterceptors,
} from "@nestjs/common";
import {Environment} from "../config/environment.service";
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
import {Action} from "../casl/actions.enum";
import {subject} from "@casl/ability";
import {SubjectEnum} from "../entity/subjectEnum";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";

@Controller("api/tenant")
@UseInterceptors(ClassSerializerInterceptor)
export class MemberController {
    constructor(
        private readonly configService: Environment,
        private readonly tenantService: TenantService,
        private readonly usersService: UsersService,
        private readonly roleService: RoleService,
        private readonly securityService: SecurityService,
        @InjectRepository(User) private usersRepository: Repository<User>,
    ) {
    }

    @Get("/:tenantId/members")
    @UseGuards(JwtAuthGuard)
    async getTenantMembers(
        @Request() request: any,
        @Param("tenantId") tenantId: string,
    ): Promise<User[]> {
        let tenant = await this.tenantService.findById(request, tenantId);
        this.securityService.check(
            request,
            Action.Read,
            subject(SubjectEnum.TENANT, tenant),
        );
        this.securityService.isAuthorized(
            request,
            Action.Read,
            SubjectEnum.MEMBER,
            {tenantId: tenantId},
        );
        const members: User[] = await this.usersRepository.find({
            where: {
                tenants: {id: tenant.id},
            },
        });

        for (const member of members) {
            member.roles = await this.roleService.getMemberRoles(
                request,
                tenant,
                member,
            );
        }
        return members;
    }

    @Post("/:tenantId/members/add")
    @UseGuards(JwtAuthGuard)
    async addMember(
        @Request() request,
        @Param("tenantId") tenantId: string,
        @Body(new ValidationPipe(ValidationSchema.MemberOperationSchema))
            body: { emails: string[] },
    ): Promise<Tenant> {
        let tenant = await this.tenantService.findById(request, tenantId);
        this.securityService.check(
            request,
            Action.Update,
            subject(SubjectEnum.TENANT, tenant),
        );
        for (const email of body.emails) {
            const isPresent = await this.usersService.existByEmail(
                request,
                email,
            );
            if (!isPresent) {
                await this.usersService.createShadowUser(request, email, email);
            }
            const user = await this.usersService.findByEmail(request, email);
            await this.tenantService.addMember(request, tenant.id, user);
        }
        tenant = await this.tenantService.findById(request, tenantId);
        return tenant;
    }

    @Delete("/:tenantId/members/delete")
    @UseGuards(JwtAuthGuard)
    async removeMember(
        @Request() request,
        @Param("tenantId") tenantId: string,
        @Body(new ValidationPipe(ValidationSchema.MemberOperationSchema))
            body: { emails: string[] },
    ): Promise<Tenant> {
        let tenant = await this.tenantService.findById(request, tenantId);
        this.securityService.check(
            request,
            Action.Update,
            subject(SubjectEnum.TENANT, tenant),
        );
        for (const email of body.emails) {
            const user = await this.usersService.findByEmail(request, email);
            let securityContext = this.securityService.getUserToken(request);
            if (securityContext.email === email) {
                throw new ForbiddenException("cannot remove self");
            }
            return this.tenantService.removeMember(request, tenantId, user);
        }
    }

    @Get("/:tenantId/member/:userId")
    @UseGuards(JwtAuthGuard)
    async getMember(
        @Request() request,
        @Param("tenantId") tenantId: string,
        @Param("userId") userId: string,
    ): Promise<any> {
        const user = await this.usersService.findById(request, userId);
        const tenant = await this.tenantService.findById(request, tenantId);
        this.securityService.check(
            request,
            Action.Read,
            subject(SubjectEnum.TENANT, tenant),
        );
        let roles = await this.tenantService.getMemberRoles(
            request,
            tenantId,
            user,
        );
        return {
            tenantId: tenant.id,
            userId: user.id,
            roles: roles,
        };
    }

    @Put("/:tenantId/member/:userId/roles")
    @UseGuards(JwtAuthGuard)
    async setMemberRoles(
        @Request() request,
        @Param("tenantId") tenantId: string,
        @Param("userId") userId: string,
        @Body(new ValidationPipe(ValidationSchema.OperatingRoleSchema))
            body: { roles: string[] },
    ): Promise<Role[]> {
        const user = await this.usersService.findById(request, userId);
        let tenant = await this.tenantService.findById(request, tenantId);
        this.securityService.check(
            request,
            Action.Update,
            subject(SubjectEnum.TENANT, tenant),
        );
        return this.tenantService.updateRolesOfMember(
            request,
            body.roles,
            tenantId,
            user,
        );
    }

    /**
     * Add roles to a given member without affecting existing roles.
     */
    @Post("/:tenantId/member/:userId/roles/add")
    @UseGuards(JwtAuthGuard)
    async addRolesToMember(
        @Request() request,
        @Param("tenantId") tenantId: string,
        @Param("userId") userId: string,
        @Body(new ValidationPipe(ValidationSchema.OperatingRoleSchema))
            body: { roles: string[] },
    ): Promise<Role[]> {
        const user = await this.usersService.findById(request, userId);
        const tenant = await this.tenantService.findById(request, tenantId);
        this.securityService.check(
            request,
            Action.Update,
            subject(SubjectEnum.TENANT, tenant),
        );

        // Only add specified roles
        await this.roleService.addRoles(request, user, tenant, body.roles);

        // Return updated set of roles
        return this.roleService.getMemberRoles(request, tenant, user);
    }

    /**
     * Remove specified roles from a member without affecting other assigned roles.
     */
    @Delete("/:tenantId/member/:userId/roles/remove")
    @UseGuards(JwtAuthGuard)
    async removeRolesFromMember(
        @Request() request,
        @Param("tenantId") tenantId: string,
        @Param("userId") userId: string,
        @Body(new ValidationPipe(ValidationSchema.OperatingRoleSchema))
            body: { roles: string[] },
    ): Promise<Role[]> {
        const user = await this.usersService.findById(request, userId);
        const tenant = await this.tenantService.findById(request, tenantId);
        this.securityService.check(
            request,
            Action.Update,
            subject(SubjectEnum.TENANT, tenant),
        );

        // Remove specified roles
        await this.roleService.removeRoles(request, user, tenant, body.roles);

        // Return updated set of roles
        return this.roleService.getMemberRoles(request, tenant, user);
    }

    @Get("/:tenantId/member/:userId/roles")
    @UseGuards(JwtAuthGuard)
    async getMemberRoles(
        @Request() request,
        @Param("tenantId") tenantId: string,
        @Param("userId") userId: string,
    ): Promise<any> {
        const user = await this.usersService.findById(request, userId);
        const tenant = await this.tenantService.findById(request, tenantId);
        this.securityService.check(
            request,
            Action.Read,
            subject(SubjectEnum.TENANT, tenant),
        );
        let roles = await this.tenantService.getMemberRoles(
            request,
            tenantId,
            user,
        );
        return {
            roles: roles,
        };
    }
}
