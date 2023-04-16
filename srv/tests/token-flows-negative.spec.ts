import * as request from 'supertest';
import {Test, TestingModule} from '@nestjs/testing';
import {INestApplication} from '@nestjs/common';
import {AppModule} from "../src/app.module";
import {ConfigService} from "../src/config/config.service";

describe('e2e negative token flow', () => {
    let app: INestApplication;
    let refreshToken = "";
    let accessToken = "";
    let clientId = "";
    let clientSecret = "";

    beforeAll(async () => {
        ConfigService.configTest();
        const moduleRef: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile()
        app = moduleRef.createNestApplication();
        await app.init();
    });

    it(`/POST Wrong Password `, async () => {
        const response = await request(app.getHttpServer())
            .post('/api/oauth/token')
            .send({
                "grant_type": "password",
                "email": "admin@auth.server.com",
                "password": "wrong-password",
                "domain": "auth.server.com"
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(401);
    });

    it(`/POST Missing Grant Type `, async () => {
        const response = await request(app.getHttpServer())
            .post('/api/oauth/token')
            .send({
                // "grant_type": "password",
                "email": "admin@auth.server.com",
                "password": "wrong-password",
                "domain": "auth.server.com"
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(400);
    });

    it(`/POST Wrong email `, async () => {
        const response = await request(app.getHttpServer())
            .post('/api/oauth/token')
            .send({
                "grant_type": "password",
                "email": "wrong-email@sada.cas",
                "password": "wrong-password",
                "domain": "auth.server.com"
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(404);
    });

    it(`/POST Wrong Domain `, async () => {
        const response = await request(app.getHttpServer())
            .post('/api/oauth/token')
            .send({
                "grant_type": "password",
                "email": "admin@auth.server.com",
                "password": "admin9000",
                "domain": "auth.server.comasda"
            })
            .set('Accept', 'application/json');

        console.log(response.body);
        expect(response.status).toEqual(404);
    });

    it(`/POST Refresh Token Missing Grant Type `, async () => {
        const response = await request(app.getHttpServer())
            .post('/api/oauth/token')
            .send({
                // "grant_type": "refresh_token",
                "refresh_token": refreshToken,
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(400);
    });

    it(`/POST Invalid Refresh Token `, async () => {
        const response = await request(app.getHttpServer())
            .post('/api/oauth/token')
            .send({
                "grant_type": "refresh_token",
                "refresh_token": "auasd",
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(400);
    });

    it(`/POST Client Credentials Missing Grant Type `, async () => {
        const response = await request(app.getHttpServer())
            .post('/api/oauth/token')
            .send({
                // "grant_type": "client_credential",
                "client_id": clientId,
                "client_secret": clientSecret
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(400);
    });

    it(`/POST Empty Client Credentials`, async () => {
        const response = await request(app.getHttpServer())
            .post('/api/oauth/token')
            .send({
                "grant_type": "client_credential",
                "client_id": "",
                "client_secret": ""
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(400);
    });

    it(`/POST Wrong Client Credentials`, async () => {
        const response = await request(app.getHttpServer())
            .post('/api/oauth/token')
            .send({
                "grant_type": "client_credential",
                "client_id": "sadasdasfasf",
                "client_secret": "asfasfasfasfasf"
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(404);
    });


    afterAll(async () => {
        await app.close();
    });
});

