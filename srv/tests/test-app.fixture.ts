import {INestApplication} from "@nestjs/common";
import {ConfigService} from "../src/config/config.service";
import {Test, TestingModule} from "@nestjs/testing";
import {AppModule} from "../src/app.module";
import {JwtService} from "@nestjs/jwt";
import * as request from 'supertest';
import * as process from "node:process";

let console = require('console');

export class TestAppFixture {
    private app: INestApplication;
    private moduleRef: TestingModule;
    private _jwtService: JwtService;

    constructor() {
    }

    public jwtService(): JwtService {
        return this._jwtService;
    }

    public async init(): Promise<TestAppFixture> {

        global.console = console;

        process.env.ENV_FILE = './envs/.env.testing';
        ConfigService.config();
        this.moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile()
        this.app = this.moduleRef.createNestApplication();
        this._jwtService = this.app.get<JwtService>(JwtService);
        await this.app.init();
        return this;
    }

    public getHttpServer(): request.SuperTest<request.Test> {
        return request(this.app.getHttpServer());
    }

    public async close(): Promise<void> {
        await this.app.close();
        await this.moduleRef.close();
    }
}
