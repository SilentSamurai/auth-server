import {TestAppFixture} from "./test-app.fixture";
import {TokenFixture} from "./token.fixture";
import {HelperFixture} from "./helper.fixture";

describe('e2e tenant', () => {
    let app: TestAppFixture;
    let tenant = {
        id: "",
        clientId: ""
    };
    let refreshToken = "";
    let accessToken = "";
    let helper: HelperFixture;

    beforeAll(async () => {
        app = await new TestAppFixture().init();
        let tokenFixture = new TokenFixture(app);
        let response = await tokenFixture.fetchAccessToken(
            "admin@auth.server.com",
            "admin9000",
            "auth.server.com"
        );
        refreshToken = response.refreshToken;
        accessToken = response.accessToken;
        helper = new HelperFixture(app, accessToken);
    });

    afterAll(async () => {
        await app.close();
    });

    it(`/POST Create Tenant`, async () => {
        tenant = await helper.tenant.createTenant("tenant-1", "test-wesite.com");

        expect(tenant.id).toBeDefined();
        expect(tenant.name).toEqual("tenant-1");
        expect(tenant.domain).toEqual("test-wesite.com");
        expect(tenant.clientId).toBeDefined();
    });

    it(`/GET Tenant Details`, async () => {
        const response = await app.getHttpServer()
            .get(`/api/tenant/${tenant.id}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Accept', 'application/json');

        expect(response.status).toEqual(200);
        console.log(response.body);

        expect(response.body.id).toBeDefined();
        expect(response.body.name).toEqual("tenant-1");
        expect(response.body.domain).toEqual("test-wesite.com");
        expect(response.body.clientId).toBeDefined();
    });

    it(`/GET Tenant Credentials`, async () => {
        const response = await app.getHttpServer()
            .get(`/api/tenant/${tenant.id}/credentials`)
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Accept', 'application/json');

        expect(response.status).toEqual(200);
        console.log(response.body);

        expect(response.body.id).toBeDefined();
        expect(response.body.clientId).toBeDefined();
        expect(response.body.clientSecret).toBeDefined();
        expect(response.body.publicKey).toBeDefined();

    });

    it(`/GET Tenant Roles`, async () => {
        const response = await app.getHttpServer()
            .get(`/api/tenant/${tenant.id}/roles`)
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Accept', 'application/json');

        expect(response.status).toEqual(200);
        console.log(response.body);

        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBeGreaterThanOrEqual(2);
        for (let role of response.body) {
            expect(role.name).toMatch(/TENANT_ADMIN|TENANT_VIEWER/);
        }

    });

    it(`/PATCH Update Tenant`, async () => {
        const response = await app.getHttpServer()
            .patch(`/api/tenant/${tenant.id}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                domain: "updated-test-wesite.com",
                name: "updated-tenant-1"
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(200);
        console.log(response.body);

        expect(response.body.id).toBeDefined();
        expect(response.body.clientId).toEqual(tenant.clientId);
        expect(response.body.name).toEqual("updated-tenant-1");
        expect(response.body.domain).toEqual("updated-test-wesite.com");

    });

    it(`/POST Create Role`, async () => {
        const name = "auditor";
        const response = await app.getHttpServer()
            .post(`/api/tenant/${tenant.id}/role/${name}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Accept', 'application/json');

        console.log(response.body);
        expect(response.status).toEqual(201);
    });

    it(`/POST Add Members`, async () => {
        const email = "legolas@mail.com";
        const response = await app.getHttpServer()
            .post(`/api/tenant/${tenant.id}/member/${email}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Accept', 'application/json');

        console.log(response.body);
        expect(response.status).toEqual(201);
    });

    it(`/GET Tenant Members`, async () => {
        const response = await app.getHttpServer()
            .get(`/api/tenant/${tenant.id}/members`)
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Accept', 'application/json');

        console.log(response.body);
        expect(response.status).toEqual(200);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body).toHaveLength(2);
        expect(response.body[0].id).toBeDefined();
        expect(response.body[0].name).toBeDefined();
    });

    it(`/PUT Update Member Role`, async () => {
        const email = "legolas@mail.com";
        const response = await app.getHttpServer()
            .put(`/api/tenant/${tenant.id}/member/${email}/roles`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                "roles": ["TENANT_VIEWER", "auditor"]
            })
            .set('Accept', 'application/json');

        console.log(response.body);
        expect(response.status).toEqual(200);
    });

    it(`/DELETE Remove Members`, async () => {
        const email = "legolas@mail.com";
        const response = await app.getHttpServer()
            .delete(`/api/tenant/${tenant.id}/member/${email}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Accept', 'application/json');

        console.log(response.body);
        expect(response.status).toEqual(200);

    });

    it(`/DELETE Remove Role`, async () => {
        const name = "auditor";
        const response = await app.getHttpServer()
            .delete(`/api/tenant/${tenant.id}/role/${name}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Accept', 'application/json');

        console.log(response.body);
        expect(response.status).toEqual(200);

    });

    it(`/DELETE Remove Tenant`, async () => {
        const response = await app.getHttpServer()
            .delete(`/api/tenant/${tenant.id}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Accept', 'application/json');

        console.log(response.body);
        expect(response.status).toEqual(200);

    });

    it(`/GET All Tenant`, async () => {
        const response = await app.getHttpServer()
            .get(`/api/tenant`)
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Accept', 'application/json');

        console.log(response.body);
        expect(response.status).toEqual(200);

        expect(response.body).toBeInstanceOf(Array);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].id).toBeDefined();
        expect(response.body[0].name).toBeDefined();
        expect(response.body[0].domain).toBeDefined();
    });

});

