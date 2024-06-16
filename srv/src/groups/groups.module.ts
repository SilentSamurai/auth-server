import {forwardRef, Module} from '@nestjs/common';
import {UsersModule} from '../users/users.module';
import {TenantModule} from "../tenants/tenant.module";
import {AuthModule} from "../auth/auth.module";
import {TypeOrmModule} from "@nestjs/typeorm";
import {Group} from "./group.entity";
import {GroupUser} from "./group.users.entity";
import {GroupRole} from "./group.roles.entity";
import {GroupService} from "./group.service";
import {GroupController} from "../controllers/group.controller";
import {RolesModule} from "../roles/roles.module";

@Module(
    {
        imports:
            [
                TypeOrmModule.forFeature([Group, GroupUser, GroupRole]),
                forwardRef(() => UsersModule),
                forwardRef(() => TenantModule),
                    forwardRef(() => AuthModule),
                    forwardRef(() => RolesModule)
            ],
            controllers: [GroupController],
        providers: [GroupService],
        exports: [GroupService]
    })
export class GroupsModule {
}
