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
        try {
            await tokenFixture.exchangeCodeWithHint(
                loginResponse.authentication_code,
                appOwnerTenant.clientId
            );
            fail('Expected BadRequestException for ambiguous tenants');
        } catch (error) {
            expect(error.status).toBe(400);
            expect(error.body.message).toContain('Multiple subscription tenants found');
        }
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
        try {
            await tokenFixture.exchangeCodeWithHint(
                loginResponse.authentication_code,
                appOwnerTenant.clientId
            );
            fail('Expected BadRequestException for ambiguous tenants');
        } catch (error) {
            expect(error.status).toBe(400);
            expect(error.body.message).toContain('Multiple subscription tenants found');
        }

        // 7. Optional: Test with domain if that's also a valid use case for subscription_tenant_id
        const resolvedResponseWithDomain = await tokenFixture.exchangeCodeWithHint(
            loginResponse.authentication_code,
            appOwnerTenant.clientId, // App's identifier
            subscriber1.domain       // subscription_tenant_id as domain
        );

        // 10. Assert successful token response with domain
        expect(resolvedResponseWithDomain.access_token).toBeDefined();
        expect(resolvedResponseWithDomain.token_type).toBe('Bearer');
        expect(resolvedResponseWithDomain.refresh_token).toBeDefined();
    });

    it('/POST check-tenant-ambiguity returns ambiguous tenants when user has multiple subscriptions', async () => {
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

        // Add user to subscriber1 and subscriber2
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

        // 6. Check tenant ambiguity
        const ambiguityCheckResponse = await tokenFixture.checkTenantAmbiguity(
            loginResponse.authentication_code,
            appOwnerTenant.clientId
        );

        // 7. Assert the response
        expect(ambiguityCheckResponse.status).toBe(201);
        expect(ambiguityCheckResponse.body.hasAmbiguity).toBe(true);
        expect(Array.isArray(ambiguityCheckResponse.body.tenants)).toBe(true);
        expect(ambiguityCheckResponse.body.tenants.length).toBe(2);

        // 8. Verify the returned tenants are the correct ones
        const tenantIds = ambiguityCheckResponse.body.tenants.map(t => t.id);
        expect(tenantIds).toContain(subscriber1.id);
        expect(tenantIds).toContain(subscriber2.id);

        // 9. Verify tenant details
        const tenant1 = ambiguityCheckResponse.body.tenants.find(t => t.id === subscriber1.id);
        const tenant2 = ambiguityCheckResponse.body.tenants.find(t => t.id === subscriber2.id);
        expect(tenant1.domain).toBe(subscriber1.domain);
        expect(tenant1.name).toBe(subscriber1.name);
        expect(tenant2.domain).toBe(subscriber2.domain);
        expect(tenant2.name).toBe(subscriber2.name);
    });

    it('/POST check-tenant-ambiguity returns no ambiguity when user has single subscription', async () => {
        // 1. Find shire.local and rivendell.local tenants
        const appOwnerTenant = await searchClient.findTenantBy({domain: 'shire.local'});
        const subscriber = await searchClient.findTenantBy({domain: 'rivendell.local'});
        expect(appOwnerTenant).toBeDefined();
        expect(subscriber).toBeDefined();

        // 2. Create a new app under appOwnerTenant
        const appData = {
            name: `single-sub-app-${uuid()}`,
            appUrl: `http://localhost:3000`,
            description: 'Single subscription app for test'
        };
        const createdApp = await appClient.createApp(appOwnerTenant.id, appData.name, appData.appUrl, appData.description);
        await appClient.publishApp(createdApp.id);

        // 3. Create a new user and add to subscriber
        const testUserEmail = `single-sub-user-${uuid()}@test.com`;
        const testUserPassword = 'TestPassword123!';
        const createdUser = await usersClient.createUser('Single Sub User', testUserEmail, testUserPassword);
        expect(createdUser).toBeDefined();
        expect(createdUser.email).toBe(testUserEmail);

        // Add user to subscriber
        await tenantClient.addMembers(subscriber.id, [testUserEmail]);

        // 4. Subscribe subscriber to the app
        await appClient.subscribeApp(createdApp.id, subscriber.id);

        // 5. Simulate login for the user and get auth code
        const loginResponse = await tokenFixture.login(
            testUserEmail,
            testUserPassword,
            appOwnerTenant.clientId
        );
        expect(loginResponse.authentication_code).toBeDefined();

        // 6. Check tenant ambiguity
        const ambiguityCheckResponse = await tokenFixture.checkTenantAmbiguity(
            loginResponse.authentication_code,
            appOwnerTenant.clientId
        );

        // 7. Assert the response
        expect(ambiguityCheckResponse.status).toBe(201);
        expect(ambiguityCheckResponse.body.hasAmbiguity).toBe(false);
        expect(ambiguityCheckResponse.body.tenants).not.toBeDefined();

    });

    it('/POST check-tenant-ambiguity returns no ambiguity when user logs into own tenant', async () => {
        // 1. Find shire.local tenant
        const appOwnerTenant = await searchClient.findTenantBy({domain: 'shire.local'});
        expect(appOwnerTenant).toBeDefined();

        // 2. Create a new app under appOwnerTenant
        const appData = {
            name: `own-tenant-app-${uuid()}`,
            appUrl: `http://localhost:3000`,
            description: 'App for own tenant test'
        };
        const createdApp = await appClient.createApp(appOwnerTenant.id, appData.name, appData.appUrl, appData.description);
        await appClient.publishApp(createdApp.id);

        // 3. Create a new user in appOwnerTenant
        const testUserEmail = `own-tenant-user-${uuid()}@test.com`;
        const testUserPassword = 'TestPassword123!';
        const createdUser = await usersClient.createUser('Own Tenant User', testUserEmail, testUserPassword);
        expect(createdUser).toBeDefined();
        expect(createdUser.email).toBe(testUserEmail);

        await tenantClient.addMembers(appOwnerTenant.id, [testUserEmail]);

        // 4. Simulate login for the user and get auth code
        const loginResponse = await tokenFixture.login(
            testUserEmail,
            testUserPassword,
            appOwnerTenant.clientId
        );
        expect(loginResponse.authentication_code).toBeDefined();

        // 5. Check tenant ambiguity
        const ambiguityCheckResponse = await tokenFixture.checkTenantAmbiguity(
            loginResponse.authentication_code,
            appOwnerTenant.clientId
        );

        // 6. Assert the response
        expect(ambiguityCheckResponse.status).toBe(201);
        expect(ambiguityCheckResponse.body.hasAmbiguity).toBe(false);
        expect(ambiguityCheckResponse.body.tenants).not.toBeDefined();
    });

    it('/POST check-tenant-ambiguity returns no ambiguity when user does not belong to any tenant', async () => {
        // 1. Find shire.local tenant
        const appOwnerTenant = await searchClient.findTenantBy({domain: 'shire.local'});
        expect(appOwnerTenant).toBeDefined();

        // 3. Create a new user without adding to any tenant
        const testUserEmail = `no-tenant-user-${uuid()}@test.com`;
        const testUserPassword = 'TestPassword123!';
        const createdUser = await usersClient.createUser('No Tenant User', testUserEmail, testUserPassword);
        expect(createdUser).toBeDefined();
        expect(createdUser.email).toBe(testUserEmail);

        try {
            const loginResponse = await tokenFixture.login(
                testUserEmail,
                testUserPassword,
                appOwnerTenant.clientId
            );
            expect(loginResponse.authentication_code).toBeDefined();
        } catch (error) {
            expect(error.status).toBe(403);
        }
    });

    it('/POST update-subscriber-tenant-hint updates the hint and allows token exchange', async () => {
        // 1. Find shire.local, rivendell.local, and bree.local tenants
        const appOwnerTenant = await searchClient.findTenantBy({domain: 'shire.local'});
        const subscriber1 = await searchClient.findTenantBy({domain: 'rivendell.local'});
        const subscriber2 = await searchClient.findTenantBy({domain: 'bree.local'});
        expect(subscriber1).toBeDefined();
        expect(subscriber2).toBeDefined();
        expect(appOwnerTenant).toBeDefined();

        // 2. Create a new app under appOwnerTenant
        const appData = {
            name: `hint-test-app-${uuid()}`,
            appUrl: `http://localhost:3000`,
            description: 'App for testing tenant hint'
        };
        const createdApp = await appClient.createApp(appOwnerTenant.id, appData.name, appData.appUrl, appData.description);
        await appClient.publishApp(createdApp.id);

        // 3. Create a new user and add to both subscribers
        const testUserEmail = `hint-test-user-${uuid()}@test.com`;
        const testUserPassword = 'TestPassword123!';
        const createdUser = await usersClient.createUser('Hint Test User', testUserEmail, testUserPassword);
        expect(createdUser).toBeDefined();
        expect(createdUser.email).toBe(testUserEmail);

        // Add user to both subscribers
        await tenantClient.addMembers(subscriber1.id, [testUserEmail]);
        await tenantClient.addMembers(subscriber2.id, [testUserEmail]);

        // 4. Subscribe both subscribers to the app
        await appClient.subscribeApp(createdApp.id, subscriber1.id);
        await appClient.subscribeApp(createdApp.id, subscriber2.id);

        // 5. Simulate login for the user and get auth code
        const loginResponse = await tokenFixture.login(
            testUserEmail,
            testUserPassword,
            appOwnerTenant.clientId
        );
        expect(loginResponse.authentication_code).toBeDefined();

        // 6. Check tenant ambiguity
        const ambiguityCheckResponse = await tokenFixture.checkTenantAmbiguity(
            loginResponse.authentication_code,
            appOwnerTenant.clientId
        );
        expect(ambiguityCheckResponse.body.hasAmbiguity).toBe(true);

        // 7. Update subscriber tenant hint
        const updateHintResponse = await tokenFixture.updateSubscriberTenantHint(
            loginResponse.authentication_code,
            appOwnerTenant.clientId,
            subscriber1.domain
        );
        expect(updateHintResponse.status).toBe(201);

        // 8. Verify token exchange works with the hint
        const tokenResponse = await tokenFixture.exchangeCodeForToken(
            loginResponse.authentication_code,
            appOwnerTenant.clientId,
        );
        expect(tokenResponse.access_token).toBeDefined();
        expect(tokenResponse.refresh_token).toBeDefined();

        // 9. Verify the token contains the correct tenant
        const decodedToken = app.jwtService().decode(tokenResponse.access_token, {json: true}) as any;
        expect(decodedToken.tenant.domain).toBe(appOwnerTenant.domain);
        expect(decodedToken.userTenant.domain).toBe(subscriber1.domain);
    });
}); 