import * as request from 'supertest';
import {Test, TestingModule} from '@nestjs/testing';
import {INestApplication} from '@nestjs/common';
import {AppModule} from "../src/app.module";
import {ConfigService} from "../src/config/config.service";

describe('e2e positive token flow', () => {
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

    it(`/POST Access Token`, async () => {
        const response = await request(app.getHttpServer())
            .post('/api/oauth/token')
            .send({
                "grant_type": "password",
                "email": "admin@auth.server.com",
                "password": "admin9000",
                "domain": "auth.server.com"
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(201);
        expect(response.body.token).toBeDefined();
        expect(response.body.expires_in).toBeDefined();
        expect(response.body.token_type).toEqual('bearer');
        expect(response.body.refresh_token).toBeDefined();
        refreshToken = response.body.refresh_token;
        accessToken = response.body.token;
    });

    it(`/POST Refresh Token`, async () => {
        const response = await request(app.getHttpServer())
            .post('/api/oauth/token')
            .send({
                "grant_type": "refresh_token",
                "refresh_token": refreshToken,
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(201);
        expect(response.body.token).toBeDefined();
        expect(response.body.expires_in).toBeDefined();
        expect(response.body.token_type).toEqual('bearer');
        expect(response.body.refresh_token).toBeDefined();
    });

    it(`/GET Global Tenant Credentials`, async () => {
        const creds = await request(app.getHttpServer())
            .get("/api/tenant/my/credentials")
            .set('Authorization', `Bearer ${accessToken}`);

        expect(creds.status).toEqual(200);
        expect(creds.body.clientId).toBeDefined();
        expect(creds.body.clientSecret).toBeDefined();
        expect(creds.body.publicKey).toBeDefined();

        clientId = creds.body.clientId;
        clientSecret = creds.body.clientSecret;
    });

    it(`/POST Client Credentials`, async () => {
        const response = await request(app.getHttpServer())
            .post('/api/oauth/token')
            .send({
                "grant_type": "client_credential",
                "client_id": clientId,
                "client_secret": clientSecret
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(201);
        expect(response.body.token).toBeDefined();
        expect(response.body.expires_in).toBeDefined();
        expect(response.body.token_type).toEqual('bearer');
    });

    it(`/POST Verify Token`, async () => {
        const response = await request(app.getHttpServer())
            .post('/api/oauth/verify')
            .send({
                "token": accessToken,
                "client_id": clientId,
                "client_secret": clientSecret
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(201);
        expect(response.body.email).toBeDefined();
        expect(response.body.name).toBeDefined();
        expect(response.body.grant_type).toEqual('password');
        expect(response.body.scopes).toBeDefined();
    });

    afterAll(async () => {
        await app.close();
    });
});

