import {INestApplication} from "@nestjs/common";
import {Environment} from "../src/config/environment.service";
import {Test, TestingModule} from "@nestjs/testing";
import {AppModule} from "../src/app.module";
import {JwtService} from "@nestjs/jwt";
import * as superTest from 'supertest';
import * as process from "node:process";
import TestAgent from "supertest/lib/agent";

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

        Environment.setup();
        this.moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile()
        this.app = this.moduleRef.createNestApplication();
        this._jwtService = this.app.get<JwtService>(JwtService);
        await this.app.init();
        return this;
    }

    public getHttpServer(): TestAgent<superTest.Test> {
        return superTest(this.app.getHttpServer());
    }

    public async close(): Promise<void> {
        await this.app.close();
        await this.moduleRef.close();
    }
}
