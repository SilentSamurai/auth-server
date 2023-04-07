import {forwardRef, Module} from "@nestjs/common";
import {UsersModule} from "../users/users.module";
import {PassportModule} from "@nestjs/passport";
import {MailModule} from "../mail/mail.module";
import {TenantService} from "./tenant.service";
import {TenantController} from "./tenant.controller";
import {TypeOrmModule} from "@nestjs/typeorm";
import {Tenant} from "./tenant.entity";
import {ScopeController} from "./scope.controller";
import {ScopeService} from "./scope.service";
import {Scope} from "./scope.entity";
import {RolesModule} from "../roles/roles.module";
import {AuthModule} from "../auth/auth.module";

@Module(
    {
            imports:
                [
                        TypeOrmModule.forFeature([Tenant, Scope]),
                        forwardRef(() => UsersModule), // Circular dependency resolved.
                        forwardRef(() => RolesModule), // Circular dependency resolved.
                        forwardRef(() => AuthModule), // Circular dependency resolved.
                        PassportModule,
                        MailModule
                ],
        controllers: [TenantController, ScopeController],
        providers: [TenantService, ScopeService],
        exports: [TenantService, ScopeService]
    })
export class TenantModule {
}
