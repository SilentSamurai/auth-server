import {Module} from '@nestjs/common';
import {ConfigModule} from '../config/config.module';
import {TypeOrmModule} from '@nestjs/typeorm';
import {MailModule} from '../mail/mail.module';
import {User} from './user.entity';
import {UsersService} from './users.service';

@Module(
    {
        imports:
            [
                ConfigModule,
                TypeOrmModule.forFeature([User]),
                MailModule
            ],
        controllers: [],
        providers: [UsersService],
        exports: [UsersService]
    })
export class UsersModule {
}
