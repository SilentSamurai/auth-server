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
import {UsersService} from "../services/users.service";
import {TenantService} from "../services/tenant.service";
import {ValidationPipe} from "../validation/validation.pipe";
import {ValidationSchema} from "../validation/validation.schema";
import {Tenant} from "../entity/tenant.entity";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {RoleGuard} from "../auth/role.guard";
import {RoleRule, Rules} from "../casl/roles.decorator";
import {SecurityService} from "../casl/security.service";
import {SubjectEnum} from "../entity/subjectEnum";
import {Action} from "../entity/actions.enum";
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
        const user = await this.usersService.findByEmail(request, request.user.email);
        const tenant: Tenant = await this.tenantService.create(
            request,
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
        let tenant = await this.tenantService.findById(request, tenantId);
        this.securityService.check(request, Action.Update, subject(SubjectEnum.TENANT, tenant));
        return this.tenantService.updateTenant(
            request,
            tenantId,
            body.name,
            body.domain
        );

    }


    @Delete('/:tenantId')
    @UseGuards(JwtAuthGuard)
    async deleteTenant(
        @Request() request,
        @Param('tenantId') tenantId: string
    ): Promise<Tenant> {
        return this.tenantService.deleteTenant(request, tenantId);
    }


    @Get('')
    @UseGuards(JwtAuthGuard)
    async getTenants(
        @Request() request,
    ): Promise<Tenant[]> {
        return await this.tenantService.getAllTenants(request);
    }


    @Get('/my/credentials')
    @UseGuards(JwtAuthGuard)
    async getMyCredentials(
        @Request() request
    ): Promise<any> {
        let securityContext = this.securityService.getUserOrTechnicalSecurityContext(request);
        let tenant = await this.tenantService.findById(request, securityContext.tenant.id);
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
        let tenant = await this.tenantService.findById(request, tenantId);
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
        let tenant = await this.tenantService.findById(request, tenantId);
        this.securityService.check(request, Action.Read, subject(SubjectEnum.TENANT, tenant));
        return tenant;
    }


}
