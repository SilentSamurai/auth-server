import {Module} from '@nestjs/common';
import {ConfigModule} from '../config/config.module';
import {AuthModule} from '../auth/auth.module';
import {MailModule} from '../mail/mail.module';
import {UsersController} from './users.controller';
import {TenantModule} from "../tenants/tenant.module";
import {UsersAdminController} from "./users.admin.controller";
import {TenantController} from "./tenant.controller";
import {MemberController} from "./members.controller";
import {UsersModule} from "../users/users.module";
import {ScopesModule} from "../scopes/scopes.module";
import {ScopeController} from "./scope.controller";

@Module(
    {
        imports:
            [
                ConfigModule,
                AuthModule, // Circular dependency resolved.
                MailModule,
                TenantModule,
                UsersModule,
                ScopesModule
            ],
        controllers: [
            UsersController,
            UsersAdminController,
            TenantController,
            MemberController,
            ScopeController
        ],
        providers: [],
        exports: []
    })
export class ControllersModule {
}
