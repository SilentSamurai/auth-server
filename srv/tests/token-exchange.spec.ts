import {TestAppFixture} from "./test-app.fixture";
import {TokenFixture} from "./token.fixture";

describe('e2e token exchange flow', () => {
    let app: TestAppFixture;
    let superAdminToken = "";
    let clientId = "";
    let tenant = {
        id: ""
    };
    let clientSecret = "";

    beforeAll(async () => {
        app = await new TestAppFixture().init();
    });

    afterAll(async () => {
        await app.close();
    });

    it(`/POST Access Token`, async () => {
        let tokenFixture = new TokenFixture(app);
        let response = await tokenFixture.fetchAccessToken(
            "admin@auth.server.com",
            "admin9000",
            "auth.server.com"
        );
        const jwt = response.jwt;
        superAdminToken = response.accessToken;
        expect(jwt.tenant.domain).toEqual("auth.server.com");

    });

    it(`/POST Create Tenant`, async () => {
        const response = await app.getHttpServer()
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

    it(`/GET Tenant Credentials`, async () => {
        const response = await app.getHttpServer()
            .get(`/api/tenant/${tenant.id}/credentials`)
            .set('Authorization', `Bearer ${superAdminToken}`)
            .set('Accept', 'application/json');

        expect(response.status).toEqual(200);
        console.log(response.body);

        expect(response.body.id).toBeDefined();
        expect(response.body.clientId).toBeDefined();
        expect(response.body.clientSecret).toBeDefined();
        expect(response.body.publicKey).toBeDefined();
        clientId = response.body.clientId;
        clientSecret = response.body.clientSecret;

    });

    it(`/POST Token Exchange`, async () => {
        const response = await app.getHttpServer()
            .post('/api/oauth/exchange')
            .send({
                "access_token": superAdminToken,
                "client_id": clientId,
                "client_secret": clientSecret
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(201);
        expect(response.body.access_token).toBeDefined();
        expect(response.body.expires_in).toBeDefined();
        expect(response.body.token_type).toEqual('Bearer');
        expect(response.body.refresh_token).toBeDefined();

        let decode = app.jwtService().decode(response.body.access_token, {json: true}) as any;
        expect(decode.sub).toBeDefined();
        expect(decode.email).toBeDefined();
        expect(decode.name).toBeDefined();
        expect(decode.grant_type).toBeDefined();
        expect(decode.tenant.id).toBeDefined();
        expect(decode.tenant.name).toBeDefined();
        expect(decode.tenant.domain).toBeDefined();
        expect(decode.tenant.domain).toEqual("test-wesite.com");
    });

    it(`/POST Token Wrong Exchange`, async () => {
        const response = await app.getHttpServer()
            .post('/api/oauth/exchange')
            .send({
                "access_token": "wrong token",
                "client_id": clientId,
                "client_secret": clientSecret
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(401);
    });

    it(`/POST Token Wrong client_id`, async () => {
        const response = await app.getHttpServer()
            .post('/api/oauth/exchange')
            .send({
                "access_token": superAdminToken,
                "client_id": "clientId",
                "client_secret": "clientSecret"
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(404);
    });

    it(`/POST Token Wrong client_secret`, async () => {
        const response = await app.getHttpServer()
            .post('/api/oauth/exchange')
            .send({
                "access_token": superAdminToken,
                "client_id": clientId,
                "client_secret": "clientSecret"
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(401);
    });


});

