import {TestAppFixture} from "../test-app.fixture";

function is2xx(response: { status: number }) {
    return response.status >= 200 && response.status < 300;
}

function expect2xx(response: { body: any; status: number }) {
    if (is2xx(response)) {
        return;
    }
    throw {status: response.status, body: response.body};
}


export class AuthorizationClient {

    private readonly app: TestAppFixture;
    private accessToken: string;

    constructor(app: TestAppFixture, accessToken: string) {
        this.app = app;
        this.accessToken = accessToken;
    }

    // -----------------------------------------------------------------
    // Authorization-related methods
    // -----------------------------------------------------------------

    /**
     * Create a new authorization
     * @param roleId - The ID of the role
     * @param tenantId - The ID of the tenant
     * @param effect - The effect (allow/deny)
     * @param action - The action to authorize
     * @param resource - The resource to authorize against
     * @param conditions - Optional conditions for the authorization
     */
    public async createAuthorization(
        roleId: string,
        tenantId: string,
        effect: string,
        action: string,
        resource: string,
        conditions: object = {}
    ) {
        const response = await this.app.getHttpServer()
            .post('/api/authorizations')
            .set('Authorization', `Bearer ${this.accessToken}`)
            .set('Accept', 'application/json')
            .send({
                role_id: roleId,
                tenant_id: tenantId,
                effect,
                action,
                resource,
                conditions
            });

        console.log("Create Authorization Response:", response.body);
        expect2xx(response);
        return response.body;
    }

    /**
     * Get all authorizations
     */
    public async getAllAuthorizations() {
        const response = await this.app.getHttpServer()
            .get('/api/authorizations')
            .set('Authorization', `Bearer ${this.accessToken}`)
            .set('Accept', 'application/json');

        console.log("Get All Authorizations Response:", response.body);
        expect2xx(response);
        return response.body;
    }

    /**
     * Get authorizations for a specific role
     * @param roleId - The ID of the role
     */
    public async getRoleAuthorizations(roleId: string) {
        const response = await this.app.getHttpServer()
            .get(`/api/authorizations/role/${roleId}`)
            .set('Authorization', `Bearer ${this.accessToken}`)
            .set('Accept', 'application/json');

        console.log("Get Role Authorizations Response:", response.body);
        expect2xx(response);
        return response.body;
    }

    /**
     * Get authorizations for a specific tenant
     * @param tenantId - The ID of the tenant
     */
    public async getTenantAuthorizations(tenantId: string) {
        const response = await this.app.getHttpServer()
            .get(`/api/authorizations/tenant/${tenantId}`)
            .set('Authorization', `Bearer ${this.accessToken}`)
            .set('Accept', 'application/json');

        console.log("Get Tenant Authorizations Response:", response.body);
        expect2xx(response);
        return response.body;
    }

    /**
     * Get a specific authorization by ID
     * @param id - The ID of the authorization
     */
    public async getAuthorization(id: string) {
        const response = await this.app.getHttpServer()
            .get(`/api/authorizations/${id}`)
            .set('Authorization', `Bearer ${this.accessToken}`)
            .set('Accept', 'application/json');

        console.log("Get Authorization Response:", response.body);
        expect2xx(response);
        return response.body;
    }

    /**
     * Update an existing authorization
     * @param id - The ID of the authorization to update
     * @param updateData - The data to update
     */
    public async updateAuthorization(
        id: string,
        updateData: {
            effect?: string;
            action?: string;
            resource?: string;
            conditions?: object;
        }
    ) {
        const response = await this.app.getHttpServer()
            .put(`/api/authorizations/${id}`)
            .set('Authorization', `Bearer ${this.accessToken}`)
            .set('Accept', 'application/json')
            .send(updateData);

        console.log("Update Authorization Response:", response.body);
        expect2xx(response);
        return response.body;
    }

    /**
     * Delete an authorization
     * @param id - The ID of the authorization to delete
     */
    public async deleteAuthorization(id: string) {
        const response = await this.app.getHttpServer()
            .delete(`/api/authorizations/${id}`)
            .set('Authorization', `Bearer ${this.accessToken}`)
            .set('Accept', 'application/json');

        console.log("Delete Authorization Response:", response.body);
        expect2xx(response);
        return response;
    }

    /**
     * Check if a user has permission for a specific action on a resource
     * @param userId - The ID of the user
     * @param action - The action to check
     * @param resource - The resource to check against
     */
    public async checkPermission(userId: string, action: string, resource: string) {
        const response = await this.app.getHttpServer()
            .post('/api/authorizations/check')
            .set('Authorization', `Bearer ${this.accessToken}`)
            .set('Accept', 'application/json')
            .send({
                user_id: userId,
                action,
                resource
            });

        console.log("Check Permission Response:", response.body);
        expect2xx(response);
        return response.body;
    }
}