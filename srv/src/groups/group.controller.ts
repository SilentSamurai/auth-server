import {ClassSerializerInterceptor, Controller, Get, Request, UseInterceptors} from "@nestjs/common";
import {ConfigService} from "../config/config.service";

@Controller('api/group')
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


}
