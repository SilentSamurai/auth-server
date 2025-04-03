import {Module} from '@nestjs/common';
import {PassportModule} from '@nestjs/passport';
import {JwtModule} from '@nestjs/jwt';
import {Environment} from '../config/environment.service';
import {JwtAuthGuard} from "./jwt-auth.guard";
import {TypeOrmModule} from "@nestjs/typeorm";
import {AuthCode} from "../entity/auth_code.entity";
import {ServiceModule} from "../services/service.module";
import {AuthService} from "./auth.service";
import {AuthCodeService} from "./auth-code.service";
import {CaslModule} from "../casl/casl.module";
import {User} from "../entity/user.entity";

@Module(
    {
        imports:
            [
                CaslModule,
                ServiceModule,
                PassportModule,
                TypeOrmModule.forFeature([AuthCode, User]),
                JwtModule.registerAsync( // Get the configuration settings from the config service asynchronously.
                    {
                        inject: [Environment],
                        useFactory: (configService: Environment) => {
                            return {
                                signOptions: {
                                    algorithm: "RS256",
                                    expiresIn: configService.get('TOKEN_EXPIRATION_TIME')
                                }
                            };
                        }
                    }),
            ],
        controllers: [],
        providers: [JwtAuthGuard, AuthService, AuthCodeService],
        exports: [JwtAuthGuard, AuthService, AuthCodeService]
    })
export class AuthModule {
}
