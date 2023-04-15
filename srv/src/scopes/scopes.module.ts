import {Module} from '@nestjs/common';
import {UsersModule} from '../users/users.module';
import {SecurityService} from './security.service';
import {ScopeService} from "./scope.service";
import {TenantModule} from "../tenants/tenant.module";
import {AuthModule} from "../auth/auth.module";
import {TypeOrmModule} from "@nestjs/typeorm";
import {Scope} from "./scope.entity";
import {UserScope} from "./user.scopes.entity";
import {CaslAbilityFactory} from "./casl-ability.factory";

@Module(
    {
        imports:
            [
                TypeOrmModule.forFeature([Scope, UserScope]),
                UsersModule,
                TenantModule,
                AuthModule
            ],
        controllers: [],
        providers: [SecurityService, ScopeService, CaslAbilityFactory],
        exports: [SecurityService, ScopeService, CaslAbilityFactory]
    })
export class ScopesModule {
}
