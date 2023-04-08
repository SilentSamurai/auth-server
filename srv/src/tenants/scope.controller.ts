import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Delete,
    Headers,
    Param,
    Post,
    UseGuards,
    UseInterceptors
} from "@nestjs/common";
import {ConfigService} from "../config/config.service";
import {UsersService} from "../users/users.service";
import {TenantService} from "./tenant.service";
import {ValidationPipe} from "../validation/validation.pipe";
import {ValidationSchema} from "../validation/validation.schema";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {RolesGuard} from "../roles/roles.guard";
import {Roles} from "../roles/roles.decorator";
import {RoleEnum} from "../roles/role.enum";
import {ScopeService} from "./scope.service";
import {Scope} from "./scope.entity";

@Controller('scope')
@UseInterceptors(ClassSerializerInterceptor)
export class ScopeController {

    constructor(
        private readonly configService: ConfigService,
        private readonly tenantService: TenantService,
        private readonly scopeService: ScopeService,
        private readonly usersService: UsersService
    ) {
    }

    @Post('/create')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.ADMIN)
    async createScope(
        @Headers() headers,
        @Body(new ValidationPipe(ValidationSchema.CreateScopeSchema)) body: { name: string, tenantId: string }
    ): Promise<Scope> {
        const tenant = await this.tenantService.findById(body.tenantId);
        return this.scopeService.create(
            body.name,
            tenant
        );
    }

    @Delete('/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.ADMIN)
    async deleteScope(
        @Param('id') id: string
    ): Promise<Scope> {
        const scope = await this.scopeService.findById(id);
        return await this.scopeService.deleteById(scope.id);
    }

    @Post('/member')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.ADMIN)
    async updateScope(
        @Headers() headers,
        @Body(new ValidationPipe(ValidationSchema.OperatingScopeSchema)) body:
            { email: string, scopes: [string], tenantId: string }
    ): Promise<Scope[]> {
        const user = await this.usersService.findByEmail(body.email);
        return this.tenantService.updateScopeOfMember(body.scopes, body.tenantId, user);
    }


}
