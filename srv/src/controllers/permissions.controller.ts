import {ClassSerializerInterceptor, Controller, Get, Request, UseGuards, UseInterceptors} from "@nestjs/common";
import {ConfigService} from "../config/config.service";
import {SecurityService} from "../casl/security.service";
import {AuthContext} from "../casl/contexts";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";

@Controller('api/v1')
@UseInterceptors(ClassSerializerInterceptor)
export class PermissionsController {

    constructor(
        private readonly configService: ConfigService,
        private readonly securityService: SecurityService
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


}
