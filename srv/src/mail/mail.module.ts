import {Module} from "@nestjs/common";
import {MailService} from "./mail.service";
import {TypeOrmModule} from "@nestjs/typeorm";
import {User} from "../entity/user.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([User])
    ],
    controllers: [],
    providers: [MailService],
    exports: [MailService],
})
export class MailModule {
}
