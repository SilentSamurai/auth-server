import { TestAppFixture } from "../test-app.fixture";
import { expect2xx, HttpClient } from "./client";

export class AppClient extends HttpClient {
    constructor(app: TestAppFixture, accessToken: string) {
        super(app, accessToken);
    }

    /**
     * Create a new app for a tenant
     */
    public async createApp(tenantId: string, name: string, appUrl: string, description?: string) {
        const response = await this.app.getHttpServer()
            .post('/api/apps/create')
            .send({
                tenantId,
                name,
                appUrl,
                description
            })
            .set('Authorization', `Bearer ${this.accessToken}`)
            .set('Accept', 'application/json');

        console.log("Create App Response:", response.body);
        expect2xx(response);
        expect(response.status).toEqual(201);
        expect(response.body.id).toBeDefined();
        expect(response.body.name).toEqual(name);
        expect(response.body.appUrl).toEqual(appUrl);
        if (description) {
            expect(response.body.description).toEqual(description);
        }

        return response.body;
    }

    /**
     * Subscribe to an app
     */
    public async subscribeToApp(appId: string, tenantId: string) {
        const response = await this.app.getHttpServer()
            .post(`/api/apps/${appId}/subscribe`)
            .send({ tenantId })
            .set('Authorization', `Bearer ${this.accessToken}`)
            .set('Accept', 'application/json');

        console.log("Subscribe to App Response:", response.body);
        expect2xx(response);
        expect(response.status).toEqual(201);
        expect(response.body.id).toBeDefined();
        expect(response.body.status).toBeDefined();
        expect(response.body.subscribedAt).toBeDefined();

        return response.body;
    }

    /**
     * Get app details by ID
     */
    public async getAppDetails(appId: string) {
        const response = await this.app.getHttpServer()
            .get(`/api/apps/${appId}`)
            .set('Authorization', `Bearer ${this.accessToken}`)
            .set('Accept', 'application/json');

        console.log("Get App Details Response:", response.body);
        expect2xx(response);
        expect(response.body.id).toEqual(appId);
        expect(response.body.name).toBeDefined();
        expect(response.body.appUrl).toBeDefined();
        expect(response.body.owner).toBeDefined();

        return response.body;
    }

    /**
     * Get all apps for a tenant
     */
    public async getTenantApps(tenantId: string) {
        const response = await this.app.getHttpServer()
            .get(`/api/apps/tenant/${tenantId}`)
            .set('Authorization', `Bearer ${this.accessToken}`)
            .set('Accept', 'application/json');

        console.log("Get Tenant Apps Response:", response.body);
        expect2xx(response);
        expect(Array.isArray(response.body)).toBe(true);

        return response.body;
    }

    /**
     * Get all subscriptions for a tenant
     */
    public async getTenantSubscriptions(tenantId: string) {
        const response = await this.app.getHttpServer()
            .get(`/api/apps/subscriptions/${tenantId}`)
            .set('Authorization', `Bearer ${this.accessToken}`)
            .set('Accept', 'application/json');

        console.log("Get Tenant Subscriptions Response:", response.body);
        expect2xx(response);
        expect(Array.isArray(response.body)).toBe(true);

        return response.body;
    }

    /**
     * Unsubscribe from an app
     */
    public async unsubscribeFromApp(appId: string, tenantId: string) {
        const response = await this.app.getHttpServer()
            .delete(`/api/apps/${appId}/subscribe`)
            .send({ tenantId })
            .set('Authorization', `Bearer ${this.accessToken}`)
            .set('Accept', 'application/json');

        console.log("Unsubscribe from App Response:", response.body);
        expect2xx(response);
        expect(response.body.id).toBeDefined();
        expect(response.body.status).toEqual('canceled');

        return response.body;
    }
} 