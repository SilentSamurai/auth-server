import {Module} from '@nestjs/common';
import {ConfigModule} from '../config/config.module';
import {AuthModule} from '../auth/auth.module';
import {MailModule} from '../mail/mail.module';
import {UsersController} from './users.controller';
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
import {PermissionsController} from "./permissions.controller";

@Module(
    {
        imports:
            [
                ConfigModule,
                AuthModule,
                MailModule,
                CaslModule,
                ServiceModule,
                TypeOrmModule.forFeature([User, Tenant, Role, TenantMember, Group])
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
            PermissionsController
        ],
        providers: [],
        exports: []
    })
export class ControllersModule {
}
