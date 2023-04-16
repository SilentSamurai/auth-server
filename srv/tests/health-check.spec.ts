import * as request from 'supertest';
import {Test, TestingModule} from '@nestjs/testing';
import {INestApplication} from '@nestjs/common';
import {AppModule} from "../src/app.module";
import {ConfigService} from "../src/config/config.service";

describe('e2e health-check', () => {
    let app: INestApplication;

    beforeAll(async () => {
        ConfigService.configTest();
        const moduleRef: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile()
        app = moduleRef.createNestApplication();
        await app.init();
    });

    it(`/GET Health Check`, () => {
        return request(app.getHttpServer())
            .get('/api/v1/into/health-check')
            .expect(200)
            .expect({
                health: true
            });
    });

    afterAll(async () => {
        await app.close();
    });
});

