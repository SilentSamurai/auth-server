import {INestApplication} from "@nestjs/common";
import {Environment} from "../src/config/environment.service";
import {Test, TestingModule} from "@nestjs/testing";
import {AppModule} from "../src/app.module";
import {JwtService} from "@nestjs/jwt";
import * as superTest from 'supertest';
import * as process from "node:process";
import TestAgent from "supertest/lib/agent";
import {createFakeSmtpServer, FakeSmtpServer} from "../src/mail/FakeSmtpServer";
import {setupConsole} from "./helper.fixture";
import {JwtServiceRS256} from "../src/auth/jwt.service";

export class TestAppFixture {
    private app: INestApplication;
    private moduleRef: TestingModule;
    private _jwtService: JwtService;
    private smtpServer: FakeSmtpServer;

    constructor() {
        setupConsole();
    }

    public get smtp(): FakeSmtpServer {
        return this.smtpServer;
    }

    public get nestApp(): INestApplication {
        return this.app;
    }

    public jwtService(): JwtService {
        return this._jwtService;
    }

    public async init(): Promise<TestAppFixture> {

        process.env.ENV_FILE = './envs/.env.testing';

        Environment.setup();

        this.smtpServer = createFakeSmtpServer();
        await this.smtpServer.listen();

        this.moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile()
        this.app = this.moduleRef.createNestApplication();
        this._jwtService = this.app.get<JwtService>(JwtServiceRS256);
        await this.app.init();
        this.app.useLogger(console);

        return this;
    }

    public getHttpServer(): TestAgent<superTest.Test> {
        return superTest(this.app.getHttpServer());
    }

    public async close() {
        this.app.flushLogs();
        await this.app.close();
        await this.moduleRef.close();
        await this.smtpServer.close();
    }
}
