import {forwardRef, Module} from "@nestjs/common";
import {UsersModule} from "../users/users.module";
import {PassportModule} from "@nestjs/passport";
import {MailModule} from "../mail/mail.module";
import {TenantService} from "./tenant.service";
import {TypeOrmModule} from "@nestjs/typeorm";
import {Tenant} from "./tenant.entity";
import {ScopesModule} from "../scopes/scopes.module";
import {AuthModule} from "../auth/auth.module";
import {TenantMember} from "./tenant.members.entity";

@Module(
    {
            imports:
                [
                    TypeOrmModule.forFeature([Tenant, TenantMember]),
                    forwardRef(() => UsersModule), // Circular dependency resolved.
                    forwardRef(() => ScopesModule), // Circular dependency resolved.
                    forwardRef(() => AuthModule), // Circular dependency resolved.
                    PassportModule,
                    MailModule
                ],
            controllers: [],
            providers: [TenantService],
            exports: [TenantService]
    })
export class TenantModule {
}
