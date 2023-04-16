import * as request from 'supertest';
import {Test, TestingModule} from '@nestjs/testing';
import {INestApplication} from '@nestjs/common';
import {AppModule} from "../src/app.module";
import {ConfigService} from "../src/config/config.service";

describe('e2e tenant', () => {
    let app: INestApplication;
    let tenant = {
        id: "",
        clientId: ""
    };
    let superAdminToken = "";
    let tenantViewerAccessToken = "";

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
        superAdminToken = response.body.token;
    });

    it(`/POST Create Tenant`, async () => {
        const response = await request(app.getHttpServer())
            .post('/api/tenant/create')
            .send({
                "name": "tenant-1",
                "domain": "test-wesite.com"
            })
            .set('Authorization', `Bearer ${superAdminToken}`)
            .set('Accept', 'application/json');

        expect(response.status).toEqual(201);
        console.log(response.body);

        expect(response.body.id).toBeDefined();
        expect(response.body.name).toEqual("tenant-1");
        expect(response.body.domain).toEqual("test-wesite.com");
        expect(response.body.clientId).toBeDefined();
        tenant = response.body;
    });

    it(`/POST Add Members`, async () => {
        const email = "legolas@mail.com";
        const response = await request(app.getHttpServer())
            .post(`/api/tenant/${tenant.id}/member/${email}`)
            .set('Authorization', `Bearer ${superAdminToken}`)
            .set('Accept', 'application/json');

        console.log(response.body);
        expect(response.status).toEqual(201);
    });

    it(`/PUT Update Member Scope`, async () => {
        const email = "legolas@mail.com";
        const response = await request(app.getHttpServer())
            .put(`/api/tenant/${tenant.id}/member/${email}/scope`)
            .set('Authorization', `Bearer ${superAdminToken}`)
            .send({
                "scopes": ["TENANT_VIEWER"]
            })
            .set('Accept', 'application/json');

        console.log(response.body);
        expect(response.status).toEqual(200);
    });

    it(`/POST Fetch User Access Token`, async () => {
        const response = await request(app.getHttpServer())
            .post('/api/oauth/token')
            .send({
                "grant_type": "password",
                "email": "legolas@mail.com",
                "password": "legolas9000",
                "domain": "test-wesite.com"
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(201);
        console.log(response.body);

        expect(response.body.token).toBeDefined();
        expect(response.body.expires_in).toBeDefined();
        expect(response.body.token_type).toEqual('bearer');
        expect(response.body.refresh_token).toBeDefined();
        tenantViewerAccessToken = response.body.token;
    });

    it(`/GET Tenant Details`, async () => {
        const response = await request(app.getHttpServer())
            .get(`/api/tenant/${tenant.id}`)
            .set('Authorization', `Bearer ${tenantViewerAccessToken}`)
            .set('Accept', 'application/json');

        console.log(response.body);
        expect(response.status).toEqual(200);
        expect(response.body.id).toBeDefined();
        expect(response.body.name).toEqual("tenant-1");
        expect(response.body.domain).toEqual("test-wesite.com");
        expect(response.body.clientId).toBeDefined();
    });

    it(`/GET Tenant Credentials`, async () => {
        const response = await request(app.getHttpServer())
            .get(`/api/tenant/${tenant.id}/credentials`)
            .set('Authorization', `Bearer ${tenantViewerAccessToken}`)
            .set('Accept', 'application/json');

        expect(response.status).toEqual(403);
    });

    it(`/GET Tenant Scopes`, async () => {
        const response = await request(app.getHttpServer())
            .get(`/api/tenant/${tenant.id}/scopes`)
            .set('Authorization', `Bearer ${tenantViewerAccessToken}`)
            .set('Accept', 'application/json');

        console.log(response.body);
        expect(response.status).toEqual(200);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBeGreaterThanOrEqual(2);
        for (let scope of response.body) {
            expect(scope.name).toMatch(/TENANT_ADMIN|TENANT_VIEWER/);
        }
    });

    it(`/PATCH Update Tenant`, async () => {
        const response = await request(app.getHttpServer())
            .patch(`/api/tenant/${tenant.id}`)
            .set('Authorization', `Bearer ${tenantViewerAccessToken}`)
            .send({
                domain: "updated-test-wesite.com",
                name: "updated-tenant-1"
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(403);
    });

    it(`/POST Create Scope`, async () => {
        const name = "auditor";
        const response = await request(app.getHttpServer())
            .post(`/api/tenant/${tenant.id}/scope/${name}`)
            .set('Authorization', `Bearer ${tenantViewerAccessToken}`)
            .set('Accept', 'application/json');

        console.log(response.body);
        expect(response.status).toEqual(403);
    });

    it(`/GET Tenant Members`, async () => {
        const response = await request(app.getHttpServer())
            .get(`/api/tenant/${tenant.id}/members`)
            .set('Authorization', `Bearer ${tenantViewerAccessToken}`)
            .set('Accept', 'application/json');

        console.log(response.body);
        expect(response.status).toEqual(200);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body).toHaveLength(2);
        expect(response.body[0].id).toBeDefined();
        expect(response.body[0].name).toBeDefined();
    });


    it(`/DELETE Remove Members`, async () => {
        const email = "legolas@mail.com";
        const response = await request(app.getHttpServer())
            .delete(`/api/tenant/${tenant.id}/member/${email}`)
            .set('Authorization', `Bearer ${tenantViewerAccessToken}`)
            .set('Accept', 'application/json');

        console.log(response.body);
        expect(response.status).toEqual(403);

    });

    it(`/DELETE Remove Scope`, async () => {
        const name = "auditor";
        const response = await request(app.getHttpServer())
            .delete(`/api/tenant/${tenant.id}/scope/${name}`)
            .set('Authorization', `Bearer ${tenantViewerAccessToken}`)
            .set('Accept', 'application/json');

        console.log(response.body);
        expect(response.status).toEqual(403);

    });

    it(`/DELETE Remove Tenant`, async () => {
        const response = await request(app.getHttpServer())
            .delete(`/api/tenant/${tenant.id}`)
            .set('Authorization', `Bearer ${tenantViewerAccessToken}`)
            .set('Accept', 'application/json');

        console.log(response.body);
        expect(response.status).toEqual(403);

    });

    it(`/GET All Tenant`, async () => {
        const response = await request(app.getHttpServer())
            .get(`/api/tenant`)
            .set('Authorization', `Bearer ${tenantViewerAccessToken}`)
            .set('Accept', 'application/json');

        console.log(response.body);
        expect(response.status).toEqual(403);
    });

    afterAll(async () => {
        await app.close();
    });
});

