import {TestAppFixture} from "../test-app.fixture";
import {v4 as uuid} from 'uuid';
import {AppClient} from '../api-client/app-client';
import {SearchClient} from '../api-client/search-client';
import {TokenFixture} from '../token.fixture';
import {UsersClient} from '../api-client/user-client';
import {TenantClient} from '../api-client/tenant-client';
import {createTenantAppServer, TenantAppServer} from '../apps_&_subscription/tenant-app-server';

describe('Ambiguous Subscription Tenant Flow', () => {
    let app: TestAppFixture;
    let appClient: AppClient;
    let searchClient: SearchClient;
    let tokenFixture: TokenFixture;
    let usersClient: UsersClient;
    let tenantClient: TenantClient;
    let superAdminToken: string;
    let mockServer: TenantAppServer;
    const MOCK_SERVER_PORT = 3000;

    beforeAll(async () => {
        // Start the mock server
        mockServer = createTenantAppServer({port: MOCK_SERVER_PORT});
        await mockServer.listen();

        app = await new TestAppFixture().init();
        tokenFixture = new TokenFixture(app);
        // Get super admin access token
        const superAdminTokenResponse = await tokenFixture.fetchAccessToken(
            'admin@auth.server.com',
            'admin9000',
            'auth.server.com'
        );
        superAdminToken = superAdminTokenResponse.accessToken;
        searchClient = new SearchClient(app, superAdminToken);
        appClient = new AppClient(app, superAdminToken);
        usersClient = new UsersClient(app, superAdminToken);
        tenantClient = new TenantClient(app, superAdminToken);
    });

    afterAll(async () => {
        await app.close();
        await mockServer.close();
    });

    it('/POST Token with ambiguous subscription tenant returns ambiguity error', async () => {
        // 1. Find shire.local, rivendell.local, and bree.local tenants
        const appOwnerTenant = await searchClient.findTenantBy({domain: 'shire.local'});
        const subscriber1 = await searchClient.findTenantBy({domain: 'rivendell.local'});
        const subscriber2 = await searchClient.findTenantBy({domain: 'bree.local'});
        expect(subscriber1).toBeDefined();
        expect(subscriber2).toBeDefined();
        expect(appOwnerTenant).toBeDefined();

        // 2. Create a new app under appOwnerTenant
        const appData = {
            name: `ambiguous-app-${uuid()}`,
            appUrl: `http://localhost:3000`,
            description: 'Ambiguous app for test'
        };
        const createdApp = await appClient.createApp(appOwnerTenant.id, appData.name, appData.appUrl, appData.description);
        await appClient.publishApp(createdApp.id);

        // 3. Create a new user and add to appOwnerTenant and subscriber1
        const testUserEmail = `ambiguous-user-${uuid()}@test.com`;
        const testUserPassword = 'TestPassword123!';
        // Create user in appOwnerTenant
        const createdUser = await usersClient.createUser('Ambiguous User', testUserEmail, testUserPassword);
        expect(createdUser).toBeDefined();
        expect(createdUser.email).toBe(testUserEmail);

        // Add user to subscriber1
        await tenantClient.addMembers(subscriber1.id, [testUserEmail]);
        await tenantClient.addMembers(subscriber2.id, [testUserEmail]);

        // 4. Subscribe both subscriber1 and subscriber2 to the app (appOwnerTenant is the owner)
        await appClient.subscribeApp(createdApp.id, subscriber1.id);
        await appClient.subscribeApp(createdApp.id, subscriber2.id);

        // 5. Simulate login for the user and get auth code for logging into the app
        const loginResponse = await tokenFixture.login(
            testUserEmail,
            testUserPassword,
            appOwnerTenant.clientId
        );
        expect(loginResponse.authentication_code).toBeDefined();

        // 6. Attempt to exchange the code for a token
        const tokenResponse = await tokenFixture.exchangeCodeForToken(
            loginResponse.authentication_code,
            appOwnerTenant.clientId
        );

        // 7. Assert ambiguous tenant error
        expect(tokenResponse.error).toBe('SUBSCRIPTION_TENANT_AMBIGUOUS');
        expect(Array.isArray(tokenResponse.tenants)).toBe(true);
        expect(tokenResponse.tenants.length).toBeGreaterThan(1);
    });

    it('/POST Token resolves ambiguous subscription tenant with subscription_tenant_id', async () => {
        // 1. Find shire.local, rivendell.local, and bree.local tenants
        const appOwnerTenant = await searchClient.findTenantBy({domain: 'shire.local'});
        const subscriber1 = await searchClient.findTenantBy({domain: 'rivendell.local'});
        const subscriber2 = await searchClient.findTenantBy({domain: 'bree.local'});
        expect(appOwnerTenant).toBeDefined();
        expect(subscriber1).toBeDefined();
        expect(subscriber2).toBeDefined();

        // 2. Create a new app under appOwnerTenant
        const appData = {
            name: `ambiguous-app-${uuid()}`,
            appUrl: `http://localhost:3000`,
            description: 'Ambiguous app for test'
        };
        const createdApp = await appClient.createApp(appOwnerTenant.id, appData.name, appData.appUrl, appData.description);
        await appClient.publishApp(createdApp.id);

        // 3. Create a new user and add to appOwnerTenant and subscriber1
        const testUserEmail = `ambiguous-user-${uuid()}@test.com`;
        const testUserPassword = 'TestPassword123!';
        // Create user in appOwnerTenant
        const createdUser = await usersClient.createUser('Ambiguous User', testUserEmail, testUserPassword);
        expect(createdUser).toBeDefined();
        expect(createdUser.email).toBe(testUserEmail);

        // Add user to subscriber1
        await tenantClient.addMembers(subscriber1.id, [testUserEmail]);
        await tenantClient.addMembers(subscriber2.id, [testUserEmail]);

        // 4. Subscribe both subscriber1 and subscriber2 to the app (appOwnerTenant is the owner)
        await appClient.subscribeApp(createdApp.id, subscriber1.id);
        await appClient.subscribeApp(createdApp.id, subscriber2.id);

        // 5. Simulate login for the user and get auth code
        const loginResponse = await tokenFixture.login(
            testUserEmail,
            testUserPassword,
            appOwnerTenant.clientId
        );
        expect(loginResponse.authentication_code).toBeDefined();

        // 6. First attempt without subscription_tenant_id should return ambiguity error
        const ambiguousResponse = await tokenFixture.exchangeCodeForToken(
            loginResponse.authentication_code,
            appOwnerTenant.clientId
        );
        expect(ambiguousResponse.error).toBe('SUBSCRIPTION_TENANT_AMBIGUOUS');
        expect(Array.isArray(ambiguousResponse.tenants)).toBe(true);

        // 7. Optional: Test with domain if that's also a valid use case for subscription_tenant_id
        const resolvedResponseWithDomain = await tokenFixture.exchangeCodeForToken(
            loginResponse.authentication_code,
            appOwnerTenant.clientId, // App's identifier
            subscriber1.domain       // subscription_tenant_id as domain
        );

        // 10. Assert successful token response with domain
        expect(resolvedResponseWithDomain.access_token).toBeDefined();
        expect(resolvedResponseWithDomain.token_type).toBe('Bearer');
        expect(resolvedResponseWithDomain.refresh_token).toBeDefined();
    });
}); 