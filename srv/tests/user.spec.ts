import * as request from 'supertest';
import {Test, TestingModule} from '@nestjs/testing';
import {INestApplication} from '@nestjs/common';
import {AppModule} from "../src/app.module";
import {ConfigService} from "../src/config/config.service";

describe('e2e users', () => {
    let app: INestApplication;
    let refreshToken = "";
    let accessToken = "";
    let user = {
        email: "",
        id: ""
    };

    beforeAll(async () => {
        ConfigService.configTest();
        const moduleRef: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile()
        app = moduleRef.createNestApplication();
        await app.init();
    });

    it(`/POST Fetch Access Token`, async () => {
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
        console.log(response.body);

        expect(response.body.token).toBeDefined();
        expect(response.body.expires_in).toBeDefined();
        expect(response.body.token_type).toEqual('bearer');
        expect(response.body.refresh_token).toBeDefined();
        refreshToken = response.body.refresh_token;
        accessToken = response.body.token;
    });

    it(`/POST Create User`, async () => {
        const response = await request(app.getHttpServer())
            .post('/api/users/create')
            .send({
                "name": "TestUser",
                "email": "TestUser@test-wesite.com",
                "password": "TestUser9000"
            })
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Accept', 'application/json');

        console.log(response.body);
        expect(response.status).toEqual(201);


        expect(response.body.id).toBeDefined();
        expect(response.body.name).toEqual("TestUser");
        expect(response.body.email).toEqual("TestUser@test-wesite.com");
        user = response.body;
    });

    it(`/GET User Details`, async () => {
        const response = await request(app.getHttpServer())
            .get(`/api/users/${user.email}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Accept', 'application/json');

        console.log(response.body);
        expect(response.status).toEqual(200);


        expect(response.body.id).toBeDefined();
        expect(response.body.name).toEqual("TestUser");
        expect(response.body.email).toEqual("TestUser@test-wesite.com");
    });

    it(`/PUT Update User`, async () => {
        const response = await request(app.getHttpServer())
            .put('/api/users/update')
            .send({
                id: user.id,
                "name": "UpdateTestUser",
                "email": "UpdatedTestUser@test-wesite.com",
                "password": "TestUser9000"
            })
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Accept', 'application/json');

        console.log(response.body);
        expect(response.status).toEqual(200);


        expect(response.body.id).toBeDefined();
        expect(response.body.name).toEqual("UpdateTestUser");
        expect(response.body.email).toEqual("UpdatedTestUser@test-wesite.com");
        user = response.body;
    });

    it(`/GET All Users`, async () => {
        const response = await request(app.getHttpServer())
            .get(`/api/users`)
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Accept', 'application/json');

        console.log(response.body);
        expect(response.status).toEqual(200);


        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBeGreaterThanOrEqual(1);
        expect(response.body.find(user => user.email === "UpdatedTestUser@test-wesite.com")).toBeDefined();
    });

    it(`/GET User Tenants`, async () => {
        const response = await request(app.getHttpServer())
            .get(`/api/users/${user.email}/tenants`)
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Accept', 'application/json');

        console.log(response.body);
        expect(response.status).toEqual(200);


        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBeGreaterThanOrEqual(0);
    });


    it(`/DELETE User`, async () => {
        const response = await request(app.getHttpServer())
            .delete(`/api/users/${user.id}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Accept', 'application/json');

        console.log(response.body);
        expect(response.status).toEqual(200);
    });


    afterAll(async () => {
        await app.close();
    });
});

