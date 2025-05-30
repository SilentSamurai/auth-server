import {Module} from "@nestjs/common";
import {ConfigModule} from "../config/config.module";
import {AuthModule} from "../auth/auth.module";
import {MailModule} from "../mail/mail.module";
import {UsersController} from "./users.controller";
import {UsersAdminController} from "./users.admin.controller";
import {TenantController} from "./tenant.controller";
import {MemberController} from "./members.controller";
import {CaslModule} from "../casl/casl.module";
import {RoleController} from "./role.controller";
import {MainController} from "./main.controller";
import {GenericSearchController} from "./generic-serach.controller";
import {TypeOrmModule} from "@nestjs/typeorm";
import {User} from "../entity/user.entity";
import {Tenant} from "../entity/tenant.entity";
import {Role} from "../entity/role.entity";
import {TenantMember} from "../entity/tenant.members.entity";
import {Group} from "../entity/group.entity";
import {ServiceModule} from "../services/service.module";
import {AuthController} from "./auth.controller";
import {PolicyController} from "./policy.controller";
import {GroupController} from "./group.controller";
import {RoleControllerV2} from "./roleV2.controller";
import {RegisterController} from "./registration.controller";
import {AppController} from "./app.controller";
import {App} from "../entity/app.entity"
import {TenantBitsController} from "./tenant-bits.controller";

@Module(
    {
        imports:
            [
                ConfigModule,
                AuthModule,
                MailModule,
                CaslModule,
                ServiceModule,
                TypeOrmModule.forFeature([User, Tenant, Role, TenantMember, Group, App])
            ],
        controllers: [
            UsersController,
            UsersAdminController,
            TenantController,
            MemberController,
            RoleController,
            MainController,
            GenericSearchController,
            AuthController,
            PolicyController,
            GroupController,
            RoleControllerV2,
            RegisterController,
            AppController,
            TenantBitsController
        ],
        providers: [],
        exports: []
    })
export class ControllersModule {
}
