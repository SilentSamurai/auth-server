import {TestAppFixture} from "./test-app.fixture";
import {TokenFixture} from "./token.fixture";
import {HelperFixture} from "./helper.fixture";

describe('e2e health-check', () => {
    let app: TestAppFixture;
    let helper: HelperFixture;

    let refreshToken = "";
    let accessToken = "";
    let tenant;

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
        tenant = await helper.createTenant("tenant-1", "test-web.com");
    });

    afterAll(async () => {
        await app.close();
    });

    it(`/Create Group for tenant`, async () => {
        const response = await app.getHttpServer()
            .post('/api/group/create')
            .send({
                "name": "group-1",
                "tenantId": tenant.id
            })
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Accept', 'application/json');

        console.log("Response: ", response.body);

        expect(response.status).toEqual(201);
        expect(response.body.id).toBeDefined();
        expect(response.body.name).toEqual("group-1");
        expect(response.body.tenantId).toEqual(tenant.id);

    });
});

