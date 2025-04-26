import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Request,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { Environment } from "../config/environment.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("api/v1")
@UseInterceptors(ClassSerializerInterceptor)
export class MainController {
  constructor(private readonly configService: Environment) {}

  @Get("/health-check")
  async healthCheck(@Request() request): Promise<any> {
    return {
      health: true,
    };
  }

  // @Get('/check-auth')
  // @UseGuards(JwtAuthGuard)
  // async checkAuth(
  //     @Request() request
  // ): Promise<any> {
  //     return {
  //         health: true
  //     }
  // }

  // @Post('/cpu-bound')
  // async cpubound(): Promise<object> {
  //     const sleepTime = 1000 * 1000000; // convert to nanoseconds
  //     const startTime = process.hrtime.bigint();
  //
  //     while (process.hrtime.bigint() - startTime < BigInt(sleepTime)) {
  //         // Busy wait
  //     }
  //     return {status: "ok"};
  // }
  //
  //
  //
  // @Post('/io-bound')
  // async iobound(): Promise<object> {
  //
  //     await sleep(1000);
  //
  //     return {status: "ok"};
  // }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
