import {Module} from '@nestjs/common';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Role} from "../entity/role.entity";
import {UserRole} from "../entity/user.roles.entity";
import {CaslAbilityFactory} from "./casl-ability.factory";
import {ConfigModule} from "../config/config.module";
import {SecurityService} from "./security.service";
import {AuthUserService} from "./authUser.service";
import {Tenant} from "../entity/tenant.entity";
import {User} from "../entity/user.entity";
import {TenantMember} from "../entity/tenant.members.entity";
import {AuthCode} from "../entity/auth_code.entity";
import {Group} from "../entity/group.entity";
import {GroupRole} from "../entity/group.roles.entity";
import {GroupUser} from "../entity/group.users.entity";
import {MongooseModule} from "@nestjs/mongoose";
import {Authorization, authorizationSchema} from "../entity/authorization.schema";
import {AuthorizationService} from "./authorization.service";

@Module(
    {
        imports: [
            ConfigModule,
            TypeOrmModule.forFeature([Tenant, User, TenantMember, Role, UserRole, AuthCode, Group, GroupRole, GroupUser]),
            MongooseModule.forFeature([{name: Authorization.name, schema: authorizationSchema}])
        ],
        controllers: [],
        providers: [SecurityService, CaslAbilityFactory, AuthUserService, AuthorizationService ],
        exports: [SecurityService, CaslAbilityFactory, AuthUserService, AuthorizationService ]
    })
export class CaslModule {
}
