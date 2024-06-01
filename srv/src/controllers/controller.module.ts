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
import {MainController} from "./main.controller";
import {GenericSearchController} from "./generic-serach.controller";
import {TypeOrmModule} from "@nestjs/typeorm";
import {User} from "../users/user.entity";
import {Tenant} from "../tenants/tenant.entity";
import {Scope} from "../scopes/scope.entity";
import {TenantMember} from "../tenants/tenant.members.entity";

@Module(
    {
        imports:
            [
                ConfigModule,
                AuthModule, // Circular dependency resolved.
                MailModule,
                TenantModule,
                UsersModule,
                ScopesModule,
                TypeOrmModule.forFeature([User, Tenant, Scope, TenantMember])
            ],
        controllers: [
            UsersController,
            UsersAdminController,
            TenantController,
            MemberController,
            ScopeController,
            MainController,
            GenericSearchController
        ],
        providers: [],
        exports: []
    })
export class ControllersModule {
}
