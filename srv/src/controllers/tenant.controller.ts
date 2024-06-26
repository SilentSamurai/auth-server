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
import {RoleGuard} from "../roles/role.guard";
import {RoleRule, Rules} from "../roles/roles.decorator";
import {SecurityService} from "../roles/security.service";
import {SubjectEnum} from "../roles/subjectEnum";
import {Action} from "../roles/actions.enum";
import {subject} from "@casl/ability";

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
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Rules(
        RoleRule.can(Action.Create, SubjectEnum.TENANT),
    )
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
    @UseGuards(JwtAuthGuard)
    async updateTenant(
        @Request() request,
        @Param('tenantId') tenantId: string,
        @Body(new ValidationPipe(ValidationSchema.UpdateTenantSchema)) body: { name: string, domain: string }
    ): Promise<Tenant> {
        let tenant = await this.tenantService.findById(tenantId);
        this.securityService.check(request, Action.Update, subject(SubjectEnum.TENANT, tenant));
        return this.tenantService.updateTenant(
            tenantId,
            body.name,
            body.domain
        );

    }


    @Delete('/:tenantId')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Rules(
        RoleRule.can(Action.Delete, SubjectEnum.TENANT),
    )
    async deleteTenant(
        @Param('tenantId') tenantId: string
    ): Promise<Tenant> {
        return this.tenantService.deleteTenant(tenantId);
    }


    @Get('')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Rules(
        RoleRule.can(Action.Manage, SubjectEnum.TENANT),
    )
    async getTenants(): Promise<Tenant[]> {
        return await this.tenantService.getAllTenants();
    }


    @Get('/my/credentials')
    @UseGuards(JwtAuthGuard)
    async getMyCredentials(
        @Request() request
    ): Promise<any> {
        let securityContext = this.securityService.getUserOrTechnicalSecurityContext(request);
        let tenant = await this.tenantService.findById(securityContext.tenant.id);
        this.securityService.check(request, Action.ReadCredentials, subject(SubjectEnum.TENANT, tenant));
        return {
            id: tenant.id,
            clientId: tenant.clientId,
            clientSecret: tenant.clientSecret,
            publicKey: tenant.publicKey
        };
    }


    @Get('/:tenantId/credentials')
    @UseGuards(JwtAuthGuard)
    async getTenantCredentials(
        @Request() request,
        @Param('tenantId') tenantId: string
    ): Promise<any> {
        let tenant = await this.tenantService.findById(tenantId);
        this.securityService.check(request, Action.ReadCredentials, subject(SubjectEnum.TENANT, tenant));
        return {
            id: tenant.id,
            clientId: tenant.clientId,
            clientSecret: tenant.clientSecret,
            publicKey: tenant.publicKey
        };
    }

    @Get('/:tenantId')
    @UseGuards(JwtAuthGuard)
    async getTenant(
        @Request() request,
        @Param('tenantId') tenantId: string
    ): Promise<Tenant> {
        let tenant = await this.tenantService.findById(tenantId);
        this.securityService.check(request, Action.Read, subject(SubjectEnum.TENANT, tenant));
        return tenant;
    }


}
