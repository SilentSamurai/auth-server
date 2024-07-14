import {Module} from '@nestjs/common';
import {PassportModule} from '@nestjs/passport';
import {JwtModule} from '@nestjs/jwt';
import {ConfigService} from '../config/config.service';
import {JwtAuthGuard} from "./jwt-auth.guard";
import {TypeOrmModule} from "@nestjs/typeorm";
import {AuthCode} from "../entity/auth_code.entity";
import {ServiceModule} from "../services/service.module";
import {AuthService} from "./auth.service";
import {AuthCodeService} from "./auth-code.service";
import {CaslModule} from "../casl/casl.module";

@Module(
    {
        imports:
            [
                CaslModule,
                ServiceModule,
                PassportModule,
                TypeOrmModule.forFeature([AuthCode]),
                JwtModule.registerAsync( // Get the configuration settings from the config service asynchronously.
                    {
                        inject: [ConfigService],
                        useFactory: (configService: ConfigService) => {
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
