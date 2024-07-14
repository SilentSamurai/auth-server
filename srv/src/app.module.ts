import {MiddlewareConsumer, Module, NestModule} from '@nestjs/common';
import {ConfigModule} from './config/config.module';
import {ServeStaticModule} from '@nestjs/serve-static';
import {ScheduleModule} from '@nestjs/schedule';
import {TypeOrmModule} from '@nestjs/typeorm';
import {CaslModule} from './casl/casl.module';
import {AuthModule} from './auth/auth.module';
import {ConfigService} from './config/config.service';
import {LoggerMiddleware} from './log/logger.middleware';
import {StartUpService} from "./startUp.service";
import {ControllersModule} from "./controllers/controller.module";
import {User} from "./entity/user.entity";
import {Tenant} from "./entity/tenant.entity";
import {TenantMember} from "./entity/tenant.members.entity";
import {UserRole} from "./entity/user.roles.entity";
import {Role} from "./entity/role.entity";
import {CreateInitialTables1681147242561} from "./migrations/1681147242561-initial-creation";
import {SessionMigration1684308185392} from "./migrations/1684308185392-session-migration";
import {AuthCode} from "./entity/auth_code.entity";
import {Migrations1718012430697} from "./migrations/1718012430697-migrations";
import {GroupRole} from "./entity/group.roles.entity";
import {GroupUser} from "./entity/group.users.entity";
import {Group} from "./entity/group.entity";
import {ServiceModule} from "./services/service.module";
import {JwtModule} from "@nestjs/jwt";

@Module({
    imports: [
        ConfigModule,
        ServeStaticModule.forRootAsync(
            {
                inject: [ConfigService],
                useFactory: (configService: ConfigService) => {
                    return [{rootPath: configService.getStaticPath()}];
                }
            }),
        ScheduleModule.forRoot(), // Initializes the scheduler and registers any declarative cron jobs, timeouts and intervals that exist within the app.
        TypeOrmModule.forRootAsync( // Get the configuration settings from the config service asynchronously.
            {
                imports: undefined,
                inject: [ConfigService],
                useFactory: (configService: ConfigService) => {
                    return {
                        type: configService.get('DATABASE_TYPE'),
                        host: configService.get('DATABASE_HOST'),
                        port: configService.get('DATABASE_PORT'),
                        username: configService.get('DATABASE_USERNAME'),
                        password: configService.get('DATABASE_PASSWORD'),
                        database: configService.get('DATABASE_NAME'),
                        entities: [Tenant, User, TenantMember, Role, UserRole, AuthCode, Group, GroupRole, GroupUser],
                        migrations: [CreateInitialTables1681147242561, SessionMigration1684308185392, Migrations1718012430697],
                        synchronize: false,
                        ssl: configService.get('DATABASE_SSL'),
                        logging: configService.get('DATABASE_LOGGING'),
                    };
                }
            }),
        CaslModule,
        ServiceModule,
        AuthModule,
        ControllersModule,
    ],
    controllers: [],
    providers: [StartUpService],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).forRoutes('*');
    }
}
