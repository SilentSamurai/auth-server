import {forwardRef, Module} from '@nestjs/common';
import {UsersModule} from '../users/users.module';
import {PassportModule} from '@nestjs/passport';
import {JwtModule} from '@nestjs/jwt';
import {MailModule} from '../mail/mail.module';
import {AuthController} from '../controllers/auth.controller';
import {ConfigService} from '../config/config.service';
import {AuthService} from './auth.service';
import {TenantModule} from "../tenants/tenant.module";
import {JwtAuthGuard} from "./jwt-auth.guard";
import {RolesModule} from "../scopes/roles.module";
import {AuthCodeService} from "./auth-code.service";
import {TypeOrmModule} from "@nestjs/typeorm";
import {AuthCode} from "./auth_code.entity";

@Module(
    {
        imports:
            [
                forwardRef(() => UsersModule), // Circular dependency resolved.
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
                MailModule,
                forwardRef(() => TenantModule),
                forwardRef(() => RolesModule)
            ],
        controllers: [AuthController],
        providers: [AuthService, JwtAuthGuard, AuthCodeService],
        exports: [AuthService, AuthCodeService]
    })
export class AuthModule {
}
