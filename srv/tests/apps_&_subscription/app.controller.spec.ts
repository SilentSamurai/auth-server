import { TestAppFixture } from '../test-app.fixture';
import { INestApplication } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { AppClient } from '../api-client/app-client';
import { SearchClient } from '../api-client/search-client';
import { TokenFixture } from '../token.fixture';
import { createTenantAppServer, TenantAppServer } from './tenant-app-server';

describe('AppController', () => {
    let app: INestApplication;
    let fixture: TestAppFixture;
    let appClient: AppClient;
    let searchClient: SearchClient;
    let tokenFixture: TokenFixture;
    let accessToken: string;
    let tenantId: string;
    let mockServer: TenantAppServer;
    const MOCK_SERVER_PORT = 3000;

    beforeAll(async () => {
        // Start the mock server
        mockServer = createTenantAppServer({ port: MOCK_SERVER_PORT });
        await mockServer.listen();
        
        // Initialize the test app
        fixture = new TestAppFixture();
        await fixture.init();
        app = fixture.nestApp;
        
        // Initialize token fixture
        tokenFixture = new TokenFixture(fixture);
        
        // Get access token for the tenant using TokenFixture
        const tokenResponse = await tokenFixture.fetchAccessToken(
            'admin@auth.server.com',
            'admin9000',
            'auth.server.com'
        );
        accessToken = tokenResponse.accessToken;
        
        // Initialize search client with the access token
        searchClient = new SearchClient(fixture, accessToken);
        
        // Find the shire.local tenant
        const shireTenant = await searchClient.findTenantBy({ domain: 'shire.local' });
        tenantId = shireTenant.id;
        
        // Initialize app client with the access token
        appClient = new AppClient(fixture, accessToken);
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
                tenantId,
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
                .set('Authorization', `Bearer ${accessToken}`)
                .set('Accept', 'application/json');

            expect(response.status).toBe(400);
        });
    });

    describe('subscribeToApp', () => {
        let testAppId: string;

        beforeEach(async () => {
            // Create a test app to subscribe to with the mock server URL
            const app = await appClient.createApp(
                tenantId,
                `test-app-${uuid()}`,
                `http://localhost:${MOCK_SERVER_PORT}`, // Use the mock server URL
                'Test app for subscription'
            );
            testAppId = app.id;
        });

        it('should successfully subscribe to an app', async () => {
            const subscription = await appClient.subscribeToApp(testAppId, tenantId);
            
            expect(subscription).toBeDefined();
            expect(subscription.id).toBeDefined();
            expect(subscription.status).toBeDefined();
            expect(subscription.subscribedAt).toBeDefined();
            
            // Verify that the onboard request was made
            const onboardRequests = mockServer.getOnboardRequests();
            expect(onboardRequests.length).toBeGreaterThan(0);
            expect(onboardRequests[0].tenantId).toBe(tenantId);
        });

        it('should successfully unsubscribe from an app', async () => {
            const subscription = await appClient.subscribeToApp(testAppId, tenantId);

            // Then unsubscribe using the AppClient
            const unsubscribeResponse = await appClient.unsubscribeApp(testAppId, tenantId);
            expect(unsubscribeResponse).toBeDefined();
            expect(unsubscribeResponse.status).toBeDefined();
            expect(unsubscribeResponse.status).toEqual(true);
            
            // Verify that the offboard request was made
            const offboardRequests = mockServer.getOffboardRequests();
            expect(offboardRequests.length).toBeGreaterThan(0);
            expect(offboardRequests[0].tenantId).toBe(tenantId);
            
            // Verify the subscription is no longer active
            const tenantSubscriptions = await appClient.getTenantSubscriptions(tenantId);
            const unsubscribedApp = tenantSubscriptions.find(sub => sub.appId === testAppId);
            expect(unsubscribedApp).toBeUndefined();
        });

        it('should fail when subscribing with invalid app ID', async () => {
            const invalidAppId = 'invalid-uuid';
            
            // This test needs to be done with direct HTTP request since the client validates inputs
            const response = await fixture.getHttpServer()
                .post(`/api/apps/${invalidAppId}/subscribe`)
                .send({ tenantId })
                .set('Authorization', `Bearer ${accessToken}`)
                .set('Accept', 'application/json');

            expect(response.status).toBe(400);
        });

        it('should fail when subscribing with invalid tenant ID', async () => {
            const invalidTenantId = 'invalid-uuid';
            
            // This test needs to be done with direct HTTP request since the client validates inputs
            const response = await fixture.getHttpServer()
                .post(`/api/apps/${testAppId}/subscribe`)
                .send({ tenantId: invalidTenantId })
                .set('Authorization', `Bearer ${accessToken}`)
                .set('Accept', 'application/json');

            expect(response.status).toBe(400);
        });
    });
}); 