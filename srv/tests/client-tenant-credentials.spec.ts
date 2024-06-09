import {TestAppFixture} from "./test-app.fixture";
import {TokenFixture} from "./token.fixture";

describe('e2e tenant technical credential', () => {
    let app: TestAppFixture;
    let tenant = {
        id: "",
        clientId: "",
        clientSecret: ""
    };
    let technicalAccessToken = "";
    let adminAccessToken = "";

    beforeAll(async () => {
        app = await new TestAppFixture().init();
    });

    afterAll(async () => {
        await app.close();
    });

    it(`/POST Fetch Access Token`, async () => {
        let tokenFixture = new TokenFixture(app);
        let response = await tokenFixture.fetchAccessToken(
            "secure@auth.server.com",
            "admin9000",
            "auth.server.com"
        );
        adminAccessToken = response.accessToken;
    });

    it(`/POST Create Tenant`, async () => {
        const response = await app.getHttpServer()
            .post('/api/tenant/create')
            .send({
                "name": "tenant-1",
                "domain": "test-wesite.com"
            })
            .set('Authorization', `Bearer ${adminAccessToken}`)
            .set('Accept', 'application/json');

        expect(response.status).toEqual(201);
        console.log(response.body);

        expect(response.body.id).toBeDefined();
        expect(response.body.name).toEqual("tenant-1");
        expect(response.body.domain).toEqual("test-wesite.com");
        expect(response.body.clientId).toBeDefined();
        tenant = response.body;
    });

    it(`/GET Tenant Credentials`, async () => {
        const response = await app.getHttpServer()
            .get(`/api/tenant/${tenant.id}/credentials`)
            .set('Authorization', `Bearer ${adminAccessToken}`)
            .set('Accept', 'application/json');

        expect(response.status).toEqual(200);
        console.log(response.body);

        expect(response.body.id).toBeDefined();
        expect(response.body.clientId).toBeDefined();
        expect(response.body.clientSecret).toBeDefined();
        expect(response.body.publicKey).toBeDefined();
        tenant.clientSecret = response.body.clientSecret;
    });

    it(`/POST Client Credentials`, async () => {
        const response = await app.getHttpServer()
            .post('/api/oauth/token')
            .send({
                "grant_type": "client_credential",
                "client_id": tenant.clientId,
                "client_secret": tenant.clientSecret
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(201);
        expect(response.body.access_token).toBeDefined();
        expect(response.body.expires_in).toBeDefined();
        expect(response.body.token_type).toEqual('Bearer');
        technicalAccessToken = response.body.access_token;
    });

    it(`/POST Wrong Client Credentials`, async () => {
        const response = await app.getHttpServer()
            .post('/api/oauth/token')
            .send({
                "grant_type": "client_credential",
                "client_id": tenant.clientId,
                "client_secret": "dsgsdg"
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(401);
    });

    it(`/GET Tenant Credentials`, async () => {
        const response = await app.getHttpServer()
            .get(`/api/tenant/${tenant.id}/credentials`)
            .set('Authorization', `Bearer ${technicalAccessToken}`)
            .set('Accept', 'application/json');

        expect(response.status).toEqual(200);
        console.log(response.body);

        expect(response.body.id).toBeDefined();
        expect(response.body.clientId).toBeDefined();
        expect(response.body.clientSecret).toBeDefined();
        expect(response.body.publicKey).toBeDefined();
    });

    it(`/GET Tenant Details`, async () => {
        const response = await app.getHttpServer()
            .get(`/api/tenant/${tenant.id}`)
            .set('Authorization', `Bearer ${technicalAccessToken}`)
            .set('Accept', 'application/json');

        expect(response.status).toEqual(200);
        console.log(response.body);

        expect(response.body.id).toBeDefined();
        expect(response.body.name).toEqual("tenant-1");
        expect(response.body.domain).toEqual("test-wesite.com");
        expect(response.body.clientId).toBeDefined();
    });

    it(`/GET Tenant Members`, async () => {
        const response = await app.getHttpServer()
            .get(`/api/tenant/${tenant.id}/members`)
            .set('Authorization', `Bearer ${technicalAccessToken}`)
            .set('Accept', 'application/json');

        console.log(response.body);
        expect(response.status).toEqual(200);


        expect(response.body).toBeInstanceOf(Array);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].id).toBeDefined();
        expect(response.body[0].name).toBeDefined();

    });

    it(`/GET Tenant Scopes`, async () => {
        const response = await app.getHttpServer()
            .get(`/api/tenant/${tenant.id}/scopes`)
            .set('Authorization', `Bearer ${technicalAccessToken}`)
            .set('Accept', 'application/json');

        expect(response.status).toEqual(200);
        console.log(response.body);

        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBeGreaterThanOrEqual(2);
        for (let scope of response.body) {
            expect(scope.name).toMatch(/TENANT_ADMIN|TENANT_VIEWER/);
        }
    });

    it(`/PATCH Update Tenant`, async () => {
        const response = await app.getHttpServer()
            .patch(`/api/tenant/${tenant.id}`)
            .set('Authorization', `Bearer ${technicalAccessToken}`)
            .send({
                domain: "updated-test-wesite.com",
                name: "updated-tenant-1"
            })
            .set('Accept', 'application/json');

        console.log(response.body);
        expect(response.status).toEqual(403);
    });

    it(`/POST Create Scope`, async () => {
        const name = "auditor";
        const response = await app.getHttpServer()
            .post(`/api/tenant/${tenant.id}/scope/${name}`)
            .set('Authorization', `Bearer ${technicalAccessToken}`)
            .set('Accept', 'application/json');

        console.log(response.body);
        expect(response.status).toEqual(403);
    });

    it(`/POST Add Members`, async () => {
        const email = "legolas@mail.com";
        const response = await app.getHttpServer()
            .post(`/api/tenant/${tenant.id}/member/${email}`)
            .set('Authorization', `Bearer ${technicalAccessToken}`)
            .set('Accept', 'application/json');

        console.log(response.body);
        expect(response.status).toEqual(403);
    });


    it(`/PUT Update Member Scope`, async () => {
        const email = "legolas@mail.com";
        const response = await app.getHttpServer()
            .put(`/api/tenant/${tenant.id}/member/${email}/scope`)
            .set('Authorization', `Bearer ${technicalAccessToken}`)
            .send({
                "scopes": ["TENANT_VIEWER", "auditor"]
            })
            .set('Accept', 'application/json');

        console.log(response.body);
        expect(response.status).toEqual(403);
    });


    it(`/DELETE Remove Members`, async () => {
        const email = "legolas@mail.com";
        const response = await app.getHttpServer()
            .delete(`/api/tenant/${tenant.id}/member/${email}`)
            .set('Authorization', `Bearer ${technicalAccessToken}`)
            .set('Accept', 'application/json');

        console.log(response.body);
        expect(response.status).toEqual(403);

    });

    it(`/DELETE Remove Scope`, async () => {
        const name = "auditor";
        const response = await app.getHttpServer()
            .delete(`/api/tenant/${tenant.id}/scope/${name}`)
            .set('Authorization', `Bearer ${technicalAccessToken}`)
            .set('Accept', 'application/json');

        console.log(response.body);
        expect(response.status).toEqual(403);

    });

    it(`/DELETE Remove Tenant`, async () => {
        const response = await app.getHttpServer()
            .delete(`/api/tenant/${tenant.id}`)
            .set('Authorization', `Bearer ${technicalAccessToken}`)
            .set('Accept', 'application/json');

        console.log(response.body);
        expect(response.status).toEqual(403);

    });

});

