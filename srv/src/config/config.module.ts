import {Global, Module} from "@nestjs/common";
import {Environment} from "./environment.service";

@Global()
@Module({
    imports: [],
    controllers: [],
    providers: [Environment],
    exports: [Environment],
})
export class ConfigModule {}
