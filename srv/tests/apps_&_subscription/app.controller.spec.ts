import {TestAppFixture} from '../test-app.fixture';
import {INestApplication} from '@nestjs/common';
import {v4 as uuid} from 'uuid';
import {AppClient} from '../api-client/app-client';
import {SearchClient} from '../api-client/search-client';
import {TokenFixture} from '../token.fixture';
import {createTenantAppServer, TenantAppServer} from './tenant-app-server';

describe('AppController', () => {
    let app: INestApplication;
    let fixture: TestAppFixture;
    let appClient: AppClient;
    let searchClient: SearchClient;
    let tokenFixture: TokenFixture;
    let creatorAccessToken: string;
    let subscriberAccessToken: string;
    let creatorTenantId: string;
    let subscriberTenantId: string;
    let mockServer: TenantAppServer;
    const MOCK_SERVER_PORT = 3000;

    beforeAll(async () => {
        // Start the mock server
        mockServer = createTenantAppServer({port: MOCK_SERVER_PORT});
        await mockServer.listen();

        // Initialize the test app
        fixture = new TestAppFixture();
        await fixture.init();
        app = fixture.nestApp;

        // Initialize token fixture
        tokenFixture = new TokenFixture(fixture);

        // Get super admin access token
        const superAdminTokenResponse = await tokenFixture.fetchAccessToken(
            'admin@auth.server.com',
            'admin9000',
            'auth.server.com'
        );
        const superAdminToken = superAdminTokenResponse.accessToken;

        // Initialize search client with super admin token
        searchClient = new SearchClient(fixture, superAdminToken);

        // Find the existing test tenants
        const shireTenant = await searchClient.findTenantBy({domain: 'shire.local'});
        const breeTenant = await searchClient.findTenantBy({domain: 'bree.local'});

        creatorTenantId = shireTenant.id;
        subscriberTenantId = breeTenant.id;

        // Get access tokens for both tenants
        const creatorTokenResponse = await tokenFixture.fetchAccessToken(
            'admin@shire.local',
            'admin9000',
            'shire.local'
        );
        creatorAccessToken = creatorTokenResponse.accessToken;

        const subscriberTokenResponse = await tokenFixture.fetchAccessToken(
            'admin@bree.local',
            'admin9000',
            'bree.local'
        );
        subscriberAccessToken = subscriberTokenResponse.accessToken;

        // Initialize app client with creator's access token
        appClient = new AppClient(fixture, creatorAccessToken);
    });

    afterAll(async () => {
        // Close the mock server
        await fixture.close();
        await mockServer.close();
    });

    describe('createApp', () => {
        it('should create a new app with valid data', async () => {
            const appData = {
                name: `test-app-${uuid()}`,
                appUrl: `http://localhost:${MOCK_SERVER_PORT}`,
                description: 'Test application description'
            };

            const createAppResponse = await appClient.createApp(
                creatorTenantId,
                appData.name,
                appData.appUrl,
                appData.description
            );

            expect(createAppResponse).toHaveProperty('id');
            expect(createAppResponse).toHaveProperty('name', appData.name);
            expect(createAppResponse).toHaveProperty('description', appData.description);
            expect(createAppResponse).toHaveProperty('createdAt');
        });

        it('should fail when required fields are missing', async () => {
            // This test needs to be done with direct HTTP request since the client validates inputs
            const invalidData = {
                tenantId: uuid(),
                // name is missing
                appUrl: 'https://test-app.example.com'
            };

            const response = await fixture.getHttpServer()
                .post('/api/apps/create')
                .send(invalidData)
                .set('Authorization', `Bearer ${creatorAccessToken}`)
                .set('Accept', 'application/json');

            expect(response.status).toBe(400);
        });
    });

    describe('subscribeToApp', () => {
        let testAppId: string;

        beforeEach(async () => {
            // Create a test app to subscribe to with the mock server URL
            const app = await appClient.createApp(
                creatorTenantId,
                `test-app-${uuid()}`,
                `http://localhost:${MOCK_SERVER_PORT}`, // Use the mock server URL
                'Test app for subscription'
            );
            testAppId = app.id;
        });

        it('should successfully subscribe to an app', async () => {
            // Create a new app client with subscriber's access token
            const subscriberAppClient = new AppClient(fixture, subscriberAccessToken);

            const subscription = await subscriberAppClient.subscribeApp(testAppId, subscriberTenantId);

            expect(subscription).toBeDefined();
            expect(subscription.id).toBeDefined();
            expect(subscription.status).toBeDefined();
            expect(subscription.subscribedAt).toBeDefined();

            // Verify that the onboard request was made
            const onboardRequests = mockServer.getOnboardRequests();
            expect(onboardRequests.length).toBeGreaterThan(0);
            expect(onboardRequests[0].tenantId).toBe(subscriberTenantId);

            // Assert the technical token is for the app owner (creatorTenantId)
            const lastDecodedToken = mockServer.getLastDecodedToken();
            expect(lastDecodedToken).toBeDefined();
            expect(lastDecodedToken.grant_type).toBe('client_credentials');
            expect(lastDecodedToken.tenant?.domain).toBe('shire.local');
        });

        it('should successfully unsubscribe from an app', async () => {
            // Create a new app client with subscriber's access token
            const subscriberAppClient = new AppClient(fixture, subscriberAccessToken);

            const subscription = await subscriberAppClient.subscribeApp(testAppId, subscriberTenantId);

            // Then unsubscribe using the AppClient
            const unsubscribeResponse = await subscriberAppClient.unsubscribeApp(testAppId, subscriberTenantId);
            expect(unsubscribeResponse).toBeDefined();
            expect(unsubscribeResponse.status).toBeDefined();
            expect(unsubscribeResponse.status).toEqual(true);

            // Verify that the offboard request was made
            const offboardRequests = mockServer.getOffboardRequests();
            expect(offboardRequests.length).toBeGreaterThan(0);
            expect(offboardRequests[0].tenantId).toBe(subscriberTenantId);

            // Assert the technical token is for the app owner (creatorTenantId)
            const lastDecodedToken = mockServer.getLastDecodedToken();
            expect(lastDecodedToken).toBeDefined();
            expect(lastDecodedToken.grant_type).toBe('client_credentials');
            expect(lastDecodedToken.tenant?.domain).toBe('shire.local');

            // Verify the subscription is no longer active
            const tenantSubscriptions = await subscriberAppClient.getTenantSubscriptions(subscriberTenantId);
            const unsubscribedApp = tenantSubscriptions.find(sub => sub.appId === testAppId);
            expect(unsubscribedApp).toBeUndefined();
        });

        it('should fail when subscribing with invalid app ID', async () => {
            const invalidAppId = 'invalid-uuid';

            // This test needs to be done with direct HTTP request since the client validates inputs
            const response = await fixture.getHttpServer()
                .post(`/api/apps/${invalidAppId}/subscribe/${subscriberTenantId}`)
                .send({})
                .set('Authorization', `Bearer ${subscriberAccessToken}`)
                .set('Accept', 'application/json');

            console.log(response.body)

            expect(response.status).toBe(400);
        });

        it('should fail when subscribing with invalid tenant ID', async () => {
            const invalidTenantId = 'invalid-uuid';

            // This test needs to be done with direct HTTP request since the client validates inputs
            const response = await fixture.getHttpServer()
                .post(`/api/apps/${testAppId}/subscribe/${invalidTenantId}`)
                .send({})
                .set('Authorization', `Bearer ${subscriberAccessToken}`)
                .set('Accept', 'application/json');

            expect(response.status).toBe(400);
        });
    });

    it('should include the correct scope in the access token after subscribing', async () => {
        // Subscribe to an app
        const subscriberAppClient = new AppClient(fixture, subscriberAccessToken);
        const app = await appClient.createApp(
            creatorTenantId,
            `test-app-scope-${uuid()}`,
            `http://localhost:${MOCK_SERVER_PORT}`,
            'Test app for scope validation'
        );
        await subscriberAppClient.subscribeApp(app.id, subscriberTenantId);

        // Fetch access token for the subscriber again (should now include scope)
        const tokenResponse = await tokenFixture.fetchAccessToken(
            'admin@bree.local',
            'admin9000',
            'shire.local'
        );
        // The decoded JWT is in tokenResponse.jwt
        expect(tokenResponse.jwt).toBeDefined();
        expect(tokenResponse.jwt.scopes).toBeDefined();
        expect(Array.isArray(tokenResponse.jwt.scopes)).toBe(true);
        // Should include at least one scope (role) from the subscription
        expect(tokenResponse.jwt.scopes.length).toBeGreaterThan(0);
        // Optionally, check for a specific role name if known (e.g., 'TENANT_VIEWER')
        // expect(tokenResponse.jwt.scopes).toContain('TENANT_VIEWER');
    });
    
}); 