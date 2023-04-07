import {forwardRef, Module} from '@nestjs/common';
import {UsersModule} from '../users/users.module';
import {PassportModule} from '@nestjs/passport';
import {JwtModule} from '@nestjs/jwt';
import {MailModule} from '../mail/mail.module';
import {AuthController} from './auth.controller';
import {ConfigService} from '../config/config.service';
import {AuthService} from './auth.service';
import {LocalAuthGuard} from './local-auth.guard';
import {TenantModule} from "../tenants/tenant.module";
import {JwtAuthGuard} from "./jwt-auth.guard";

@Module(
    {
        imports:
            [
                forwardRef(() => UsersModule), // Circular dependency resolved.
                PassportModule,
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
                forwardRef(() => TenantModule)
            ],
        controllers: [AuthController],
        providers: [AuthService, LocalAuthGuard, JwtAuthGuard],
        exports: [AuthService]
    })
export class AuthModule {
}
