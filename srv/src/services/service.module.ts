import {Module} from '@nestjs/common';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Role} from "../entity/role.entity";
import {UserRole} from "../entity/user.roles.entity";
import {RoleService} from "./role.service";
import {UsersService} from "./users.service";
import {GroupService} from "./group.service";
import {SecurityService} from "../casl/security.service";
import {TenantService} from "./tenant.service";
import {Tenant} from "../entity/tenant.entity";
import {TenantMember} from "../entity/tenant.members.entity";
import {User} from "../entity/user.entity";
import {AuthCode} from "../entity/auth_code.entity";
import {Group} from "../entity/group.entity";
import {GroupRole} from "../entity/group.roles.entity";
import {GroupUser} from "../entity/group.users.entity";
import {CaslModule} from "../casl/casl.module";

@Module(
    {
        imports: [
            TypeOrmModule.forFeature([Tenant, User, TenantMember, Role, UserRole, AuthCode, Group, GroupRole, GroupUser]),
            CaslModule,
        ],
        controllers: [],
        providers: [UsersService, GroupService, TenantService, RoleService],
        exports: [ UsersService, GroupService, TenantService, RoleService]
    })
export class ServiceModule {
}
