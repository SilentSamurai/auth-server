import {TestAppFixture} from "../test-app.fixture";
import {PolicyClient} from "../api-client/policy-client";
import {TokenFixture} from "../token.fixture";
import {TenantClient} from "../api-client/tenant-client";
import {SearchClient} from "../api-client/search-client";
import {Action, Effect} from "../../src/casl/actions.enum";

describe('PolicyController (e2e)', () => {
    let app: TestAppFixture;
    let accessToken: string;
    let authorizationId: string;
    let authClient: PolicyClient;
    let role;

    beforeAll(async () => {
        app = await new TestAppFixture().init();
        const tokenFixture = new TokenFixture(app);
        const tokenResponse = await tokenFixture.fetchAccessToken(
            "admin@auth.server.com",
            "admin9000",
            "auth.server.com"
        );
        accessToken = tokenResponse.accessToken;
        authClient = new PolicyClient(app, accessToken);
        const tenantClient = new TenantClient(app, accessToken);
        const searchClient = new SearchClient(app, accessToken);
        const tenant = await searchClient.findByTenant({domain: "auth.server.com"});

        role = await tenantClient.createRole(tenant.id, "TEST_ROLE");

    });

    afterAll(async () => {
        await app.close();
    });

    it('should create an policy', async () => {
        const auth = await authClient.createAuthorization(
            role.id,
            Effect.ALLOW,
            Action.Read,
            'orders',
            {country: 'US'}
        );
        expect(auth).toHaveProperty('id');
        expect(auth.effect).toEqual(Effect.ALLOW);
        expect(auth.action).toEqual(Action.Read);
        expect(auth.subject).toEqual("orders");
        expect(auth.conditions).toBeDefined();
        expect(auth.conditions.country).toBeDefined();
        expect(auth.conditions.country).toEqual("US");
        authorizationId = auth.id;
    });

    it('should retrieve an policy by ID', async () => {
        const auth = await authClient.getAuthorization(authorizationId);

        expect(auth).toHaveProperty('id');
        expect(auth.effect).toEqual(Effect.ALLOW);
        expect(auth.action).toEqual(Action.Read);
        expect(auth.subject).toEqual("orders");
        expect(auth.conditions).toBeDefined();
        expect(auth.conditions.country).toBeDefined();
        expect(auth.conditions.country).toEqual("US");
    });

    it('should retrieve authorizations by role', async () => {
        const response = await authClient.getRoleAuthorizations(role.id);

        expect(Array.isArray(response)).toBe(true);
        expect(response.length).toBeGreaterThan(0);
        const auth = response[0];
        expect(auth).toHaveProperty('id');
        expect(auth.effect).toEqual(Effect.ALLOW);
        expect(auth.action).toEqual(Action.Read);
        expect(auth.subject).toEqual("orders");
        expect(auth.conditions).toBeDefined();
        expect(auth.conditions.country).toBeDefined();
        expect(auth.conditions.country).toEqual("US");
    });

    it('should update an policy', async () => {
        const auth = await authClient.updateAuthorization(authorizationId, {
            effect: Effect.DENY,
            action: Action.Update,
        });

        expect(auth).toHaveProperty('id');
        expect(auth.effect).toEqual(Effect.DENY);
        expect(auth.action).toEqual(Action.Update);
        expect(auth.subject).toEqual("orders");
        expect(auth.conditions).toBeDefined();
        expect(auth.conditions.country).toBeDefined();
        expect(auth.conditions.country).toEqual("US");
    });

    it('should delete an policy', async () => {
        await authClient.deleteAuthorization(authorizationId);
    });

    it('should return 404 when retrieving a non-existent policy', async () => {
        try {
            const response = await authClient.getAuthorization("non-existent");
        } catch (e) {
            expect(e.status).toBe(404);
        }
    });

    it('should return 403 when unauthorized user tries to access', async () => {
        // const response = await app.getHttpServer()
        //     .get(`/api/authorizations/role/${role.id}`);
        //
        // expect(response.status).toBe(403);
    });

    it('get current user permissions', async () => {
        const permissions = await authClient.getMyPermission();
        expect(permissions).toBeInstanceOf(Array);
        expect(permissions.length).toBeGreaterThan(0);
        for (let permission of permissions) {
            expect(permission.action).toBeDefined();
            expect(permission.subject).toBeDefined();
        }
    });
});
