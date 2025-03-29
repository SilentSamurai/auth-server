function is2xx(response: { status: number }) {
    return response.status >= 200 && response.status < 300;
}

function expect2xx(response: { body: any; status: number }) {
    if (is2xx(response)) {
        return;
    }
    throw {status: response.status, body: response.body};
}

import {TestAppFixture} from "../test-app.fixture";

export class UsersClient {
    private readonly app: TestAppFixture;
    private accessToken: string;

    constructor(app: TestAppFixture, accessToken: string) {
        this.app = app;
        this.accessToken = accessToken;
    }

    // -----------------------------------------------------------------
    // Create a user (POST /api/users/create)
    // -----------------------------------------------------------------
    public async createUser(name: string, email: string, password: string) {
        const response = await this.app.getHttpServer()
            .post('/api/users/create')
            .set('Authorization', `Bearer ${this.accessToken}`)
            .set('Accept', 'application/json')
            .send({name, email, password});

        console.log("Create User Response:", response.body);
        expect2xx(response);
        // Typically expect 201 for a successful creation
        return response.body;
    }

    public async getUserByEmail(email: string) {
        const response = await this.app.getHttpServer()
            .post('/api/search/Users')
            .set('Authorization', `Bearer ${this.accessToken}`)
            .set('Accept', 'application/json')
            .send({
                "pageNo": 0,
                "pageSize": 50,
                "where": [
                    {
                        "name": "email",
                        "label": "Email",
                        "value": "legolas@mail.com",
                        "operator": "equals"
                    }
                ],
                "orderBy": [],
                "expand": []
            });

        console.log("Search User Response:", response.body);
        expect2xx(response);

        expect(response.body).toBeDefined();
        expect(response.body.data).toBeDefined();
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBeGreaterThanOrEqual(1);

        return response.body.data[0];

    }

    // -----------------------------------------------------------------
    // Get user details (GET /api/users/:email)
    // -----------------------------------------------------------------
    public async getUser(id: string) {
        const response = await this.app.getHttpServer()
            .get(`/api/users/${id}`)
            .set('Authorization', `Bearer ${this.accessToken}`)
            .set('Accept', 'application/json');

        console.log("Get User Response:", response.body);
        expect2xx(response);
        return response.body;
    }

    // -----------------------------------------------------------------
    // Update a user (PUT /api/users/update)
    // -----------------------------------------------------------------
    public async updateUser(
        id: string,
        name: string,
        email: string,
        password: string
    ) {
        const response = await this.app.getHttpServer()
            .put('/api/users/update')
            .send({id, name, email, password})
            .set('Authorization', `Bearer ${this.accessToken}`)
            .set('Accept', 'application/json');

        console.log("Update User Response:", response.body);
        expect2xx(response);
        return response.body;
    }

    // -----------------------------------------------------------------
    // Get all users (GET /api/users)
    // -----------------------------------------------------------------
    public async getAllUsers() {
        const response = await this.app.getHttpServer()
            .get('/api/users')
            .set('Authorization', `Bearer ${this.accessToken}`)
            .set('Accept', 'application/json');

        console.log("Get All Users Response:", response.body);
        expect2xx(response);
        return response.body;
    }

    // -----------------------------------------------------------------
    // Get user tenants (GET /api/users/:email/tenants)
    // -----------------------------------------------------------------
    public async getUserTenants(id: string) {
        const response = await this.app.getHttpServer()
            .get(`/api/users/${id}/tenants`)
            .set('Authorization', `Bearer ${this.accessToken}`)
            .set('Accept', 'application/json');

        console.log("Get User Tenants Response:", response.body);
        expect2xx(response);
        return response.body;
    }

    // -----------------------------------------------------------------
    // Delete a user (DELETE /api/users/:id)
    // -----------------------------------------------------------------
    public async deleteUser(id: string) {
        const response = await this.app.getHttpServer()
            .delete(`/api/users/${id}`)
            .set('Authorization', `Bearer ${this.accessToken}`)
            .set('Accept', 'application/json');

        console.log("Delete User Response:", response.body);
        expect2xx(response);
        return response;
    }
}