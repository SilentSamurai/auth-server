import {Module} from '@nestjs/common';
import {UsersModule} from '../users/users.module';
import {SecurityService} from './security.service';
import {RoleService} from "./role.service";
import {TenantModule} from "../tenants/tenant.module";
import {AuthModule} from "../auth/auth.module";
import {TypeOrmModule} from "@nestjs/typeorm";
import {Role} from "./role.entity";
import {UserRole} from "./user.roles.entity";
import {CaslAbilityFactory} from "./casl-ability.factory";

@Module(
    {
        imports:
            [
                TypeOrmModule.forFeature([Role, UserRole]),
                UsersModule,
                TenantModule,
                AuthModule
            ],
        controllers: [],
        providers: [SecurityService, RoleService, CaslAbilityFactory],
        exports: [SecurityService, RoleService, CaslAbilityFactory]
    })
export class RolesModule {
}
