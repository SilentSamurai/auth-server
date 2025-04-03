import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Param,
    Patch,
    Request,
    UseGuards,
    UseInterceptors
} from "@nestjs/common";
import {Environment} from "../config/environment.service";
import {TenantService} from "../services/tenant.service";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {RoleService} from "../services/role.service";
import {Role} from "../entity/role.entity";
import {SecurityService} from "../casl/security.service";
import {UsersService} from "../services/users.service";
import * as yup from "yup";
import {ValidationPipe} from "../validation/validation.pipe";

@Controller('api/role')
@UseInterceptors(ClassSerializerInterceptor)
export class RoleControllerV2 {

    constructor(
        private readonly configService: Environment,
        private readonly tenantService: TenantService,
        private readonly userService: UsersService,
        private readonly roleService: RoleService,
        private readonly securityService: SecurityService
    ) {
    }

    static UpdateRoleSchema = yup.object().shape({
        name: yup.string().required('name is required'),
        description: yup.string().required('description is required'),
    })

    @Patch('/:roleId')
    @UseGuards(JwtAuthGuard)
    async updateRoleDescription(
        @Request() request: any,
        @Param('roleId') roleId: string,
        @Body(new ValidationPipe(RoleControllerV2.UpdateRoleSchema)) body: { name: string, description: string }
    ): Promise<Role> {
        return this.roleService.updateRole(request, roleId, body.name, body.description);
    }

}
