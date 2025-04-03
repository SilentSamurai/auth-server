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
import {Environment} from "../config/environment.service";
import {SecurityService} from "../casl/security.service";
import {AuthContext} from "../casl/contexts";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {PolicyService} from "../casl/policy.service";
import {RoleService} from "../services/role.service";
import {ValidationPipe} from "../validation/validation.pipe";
import * as yup from "yup";
import {Action, Effect} from "../casl/actions.enum";
import {Policy} from "../entity/authorization.entity";

@Controller('api/v1')
@UseInterceptors(ClassSerializerInterceptor)
export class PolicyController {

    constructor(
        private readonly configService: Environment,
        private readonly securityService: SecurityService,
        private readonly policyService: PolicyService,
        private readonly roleService: RoleService,
    ) {
    }

    @Get('/my/permissions')
    @UseGuards(JwtAuthGuard)
    async getUserPermissions(
        @Request() request: Request
    ): Promise<any> {
        const ability = this.securityService.getAbility(request as unknown as AuthContext);
        return ability.rules;
    }

    static CreateSchema = yup.object().shape({
        role: yup.string().uuid().required('role is required'),
        effect: yup.mixed<Effect>().required('effect is required').oneOf(Object.values(Effect)),
        action: yup.mixed<Action>().required('action is required').oneOf(Object.values(Action)),
        subject: yup.string().required('subject is required'),
        conditions: yup.object(),
    })

    @Post('/policy/create')
    @UseGuards(JwtAuthGuard)
    async createPermission(
        @Request() request: Request,
        @Body(new ValidationPipe(PolicyController.CreateSchema)) body: {
            role: string,
            effect: Effect,
            action: Action,
            subject: string,
            conditions: { [string: string]: string } | null,
        }
    ): Promise<Policy> {
        const authContext = request as any as AuthContext;
        const role = await this.roleService.findById(authContext, body.role);
        const policy = await this.policyService.createAuthorization(
            authContext, role, body.effect, body.action, body.subject, body.conditions);
        return policy;
    }


    @Get('/policy/:id')
    @UseGuards(JwtAuthGuard)
    async getAuthorization(
        @Request() request: Request,
        @Param('id') id: string,
    ) {
        const authContext = request as any as AuthContext;
        const auth = await this.policyService.findById(authContext, id);
        return auth;
    }

    @Get('/policy/byRole/:role_id')
    @UseGuards(JwtAuthGuard)
    async getAuthByRole(
        @Request() request: Request,
        @Param('role_id') role_id: string,
    ) {
        const authContext = request as any as AuthContext;
        const role = await this.roleService.findById(authContext, role_id);
        const auth = await this.policyService.findByRole(authContext, role);
        return auth;
    }

    static UpdateSchema = yup.object().shape({
        effect: yup.mixed<Effect>().oneOf(Object.values(Effect)),
        action: yup.mixed<Action>().oneOf(Object.values(Action)),
        subject: yup.string(),
        conditions: yup.object(),
    })

    @Patch('/policy/:id')
    @UseGuards(JwtAuthGuard)
    async updateAuthorization(
        @Request() request: Request,
        @Param('id') id: string,
        @Body(new ValidationPipe(PolicyController.UpdateSchema)) body: {
            effect?: Effect,
            action?: Action,
            subject?: string,
            conditions?: { [string: string]: string } | null,
        }
    ) {
        const authContext = request as any as AuthContext;
        const auth = await this.policyService.updateAuthorization(authContext, id, body)
        return auth;
    }

    @Delete('/policy/:id')
    @UseGuards(JwtAuthGuard)
    async deleteAuthorization(
        @Request() request: Request,
        @Param('id') id: string
    ) {
        const authContext = request as any as AuthContext;
        const auth = await this.policyService.removeAuthorization(authContext, id)
        return auth;
    }

}
