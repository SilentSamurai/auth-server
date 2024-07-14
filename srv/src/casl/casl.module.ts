import {Module} from '@nestjs/common';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Role} from "../entity/role.entity";
import {UserRole} from "../entity/user.roles.entity";
import {CaslAbilityFactory} from "./casl-ability.factory";
import {ConfigModule} from "../config/config.module";
import {SecurityService} from "./security.service";

@Module(
    {
        imports: [
            ConfigModule
        ],
        controllers: [],
        providers: [SecurityService, CaslAbilityFactory, ],
        exports: [SecurityService, CaslAbilityFactory, ]
    })
export class CaslModule {
}
