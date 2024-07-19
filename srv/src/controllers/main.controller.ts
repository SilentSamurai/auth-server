import {ClassSerializerInterceptor, Controller, Get, Request, UseGuards, UseInterceptors} from "@nestjs/common";
import {ConfigService} from "../config/config.service";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";

@Controller('api/v1')
@UseInterceptors(ClassSerializerInterceptor)
export class MainController {

    constructor(
        private readonly configService: ConfigService
    ) {
    }

    @Get('/health-check')
    async healthCheck(
        @Request() request
    ): Promise<any> {
        return {
            health: true
        }
    }


    @Get('/check-auth')
    @UseGuards(JwtAuthGuard)
    async checkAuth(
        @Request() request
    ): Promise<any> {
        return {
            health: true
        }
    }


}
