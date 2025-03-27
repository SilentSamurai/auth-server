import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Delete,
    Get, HttpException,
    Param,
    Patch,
    Post,
    Request,
    UseGuards,
    UseInterceptors
} from "@nestjs/common";
import {Environment} from "../config/environment.service";
import {SecurityService} from "../casl/security.service";
import {AuthContext} from "../casl/contexts";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {AuthorizationService} from "../casl/authorization.service";
import {RoleService} from "../services/role.service";
import {NotFoundException} from "../exceptions/not-found.exception";

@Controller('api/v1')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthorizationController {

    constructor(
        private readonly configService: Environment,
        private readonly securityService: SecurityService,
        private readonly authorizationService: AuthorizationService,
        private readonly roleService: RoleService,
    ) {
    }

    @Get('/user/permissions')
    @UseGuards(JwtAuthGuard)
    async getUserPermissions(
        @Request() request: Request
    ): Promise<any> {

        const ability = this.securityService.getAbility(request as unknown as AuthContext);

        return ability.rules;
    }

    @Post('/authorization/create')
    @UseGuards(JwtAuthGuard)
    async createPermission(
        @Request() request: Request,
        @Body() body: any
    ) {
        const authContext = request as any as AuthContext;
        const role = await this.roleService.findById(authContext, body.role_id);
        await this.authorizationService.createAuthorization(authContext, role, body.action, body.subject, body.conditions)
    }


    @Get('/authorization/:id')
    @UseGuards(JwtAuthGuard)
    async getAuthorization(
        @Request() request: Request,
        @Param('id') id: string,
    ) {
        const authContext = request as any as AuthContext;
        const auth = await this.authorizationService.findById(authContext, id) as any;
        if(!auth) {
            throw new NotFoundException("Authorization Not Found");
        }
        return {
            id: auth.id,
            role_id: auth.role_id,
            role_name: auth.role_name,
            tenant_id: auth.tenant_id,
            tenant_domain: auth.tenant_domain,
            action: auth.action,
            subject: auth.subject,
            conditions: auth.conditions,
        };
    }

    @Get('/authorization/byRole/:role_id')
    @UseGuards(JwtAuthGuard)
    async getAuthByRole(
        @Request() request: Request,
        @Param('role_id') role_id: string,
    ) {
        const authContext = request as any as AuthContext;
        const role = await this.roleService.findById(authContext, role_id);
        const auth = await this.authorizationService.getAuthorizations(authContext, role);
        return auth.map(item => {
            return {
                id: item.id,
                role_id: item.role_id,
                role_name: item.role_name,
                tenant_id: item.tenant_id,
                tenant_domain: item.tenant_domain,
                action: item.action,
                subject: item.subject,
                conditions: item.conditions,
            }
        });
    }

    @Patch('/authorization/:id')
    @UseGuards(JwtAuthGuard)
    async updateAuthorization(
        @Request() request: Request,
        @Param('id') id: string,
        @Body() body: any
    ) {
        const authContext = request as any as AuthContext;
        const role = await this.roleService.findById(authContext, id);
        const auth = await this.authorizationService.updateAuthorization(authContext, id, body.action, body.subject, body.conditions)
        return auth;
    }

    @Delete('/authorization/:id')
    @UseGuards(JwtAuthGuard)
    async deleteAuthorization(
        @Request() request: Request,
        @Param('id') id: string
    ) {
        const authContext = request as any as AuthContext;
        const auth = await this.authorizationService.removeAuthorization(authContext, id)
        return auth;
    }

}
