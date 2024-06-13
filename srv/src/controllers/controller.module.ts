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
import {RolesModule} from "../roles/roles.module";
import {RoleController} from "./role.controller";
import {MainController} from "./main.controller";
import {GenericSearchController} from "./generic-serach.controller";
import {TypeOrmModule} from "@nestjs/typeorm";
import {User} from "../users/user.entity";
import {Tenant} from "../tenants/tenant.entity";
import {Role} from "../roles/role.entity";
import {TenantMember} from "../tenants/tenant.members.entity";
import {Group} from "../groups/group.entity";

@Module(
    {
        imports:
            [
                ConfigModule,
                AuthModule, // Circular dependency resolved.
                MailModule,
                TenantModule,
                UsersModule,
                RolesModule,
                TypeOrmModule.forFeature([User, Tenant, Role, TenantMember, Group])
            ],
        controllers: [
            UsersController,
            UsersAdminController,
            TenantController,
            MemberController,
            RoleController,
            MainController,
            GenericSearchController
        ],
        providers: [],
        exports: []
    })
export class ControllersModule {
}
