import {TestAppFixture} from "../test-app.fixture";

export class GroupClient {

    private readonly app: TestAppFixture;
    private accessToken: string;

    constructor(app: TestAppFixture, accessToken: string) {
        this.app = app;
        this.accessToken = accessToken;
    }

    public async createGroup(name: string, tenantId: string) {
        const response = await this.app.getHttpServer()
            .post('/api/group/create')
            .send({
                "name": name,
                "tenantId": tenantId
            })
            .set('Authorization', `Bearer ${this.accessToken}`)
            .set('Accept', 'application/json');

        console.log("Response: ", response.body);

        expect(response.status).toEqual(201);
        expect(response.body.id).toBeDefined();
        expect(response.body.name).toEqual(name);
        expect(response.body.tenantId).toEqual(tenantId);
        return response.body;
    }

    public async getAllTenantGroups(tenantId: string) {
        const response = await this.app.getHttpServer()
            .get(`/api/tenant/${tenantId}/groups`)
            .set('Authorization', `Bearer ${this.accessToken}`)
            .set('Accept', 'application/json');

        console.log("Response: ", response.body);

        expect(response.status).toEqual(200);
        expect(Array.isArray(response.body)).toBeTruthy();
        expect(response.body.length).toBeGreaterThanOrEqual(0);
        for (const group of response.body) {
            expect(group.tenantId).toBeDefined();
            expect(group.tenantId).toEqual(tenantId);
        }
        return response.body;
    }

    public async getGroup(groupId: string) {
        const response = await this.app.getHttpServer()
            .get(`/api/group/${groupId}`)
            .set('Authorization', `Bearer ${this.accessToken}`)
            .set('Accept', 'application/json');

        console.log("Response: ", response.body);

        expect(response.status).toEqual(200);
        expect(response.body.group).toBeDefined();
        expect(response.body.group.id).toBeDefined();
        expect(response.body.group.name).toBeDefined();
        expect(response.body.group.tenant).toBeDefined();
        expect(response.body.users).toBeDefined();
        expect(response.body.roles).toBeDefined();

        return response.body;
    }

    public async addRole(groupId: string, roles: string[]) {
        const response = await this.app.getHttpServer()
            .post(`/api/group/${groupId}/add-roles`)
            .send({
                "roles": roles
            })
            .set('Authorization', `Bearer ${this.accessToken}`)
            .set('Accept', 'application/json');

        console.log("Response: ", response.body);

        expect(response.status).toEqual(201);
        expect(response.body.group).toBeDefined();
        expect(response.body.group.name).toBeDefined();
        expect(response.body.group.tenantId).toBeDefined();
        expect(response.body.roles).toBeDefined();
        expect(response.body.roles.length).toBeGreaterThanOrEqual(roles.length);
        // for (let role of response.body.roles) {
        //     expect(role.name).toContain(/ABC_ROLE|DEF_ROLE/);
        // }
        return response.body;
    }

    public async removeRoles(groupId: string, roles: string[]) {
        const response = await this.app.getHttpServer()
            .post(`/api/group/${groupId}/remove-roles`)
            .send({
                "roles": roles
            })
            .set('Authorization', `Bearer ${this.accessToken}`)
            .set('Accept', 'application/json');

        console.log("Response: ", response.body);

        expect(response.status).toEqual(201);
        expect(response.body.group).toBeDefined();
        expect(response.body.group.name).toBeDefined();
        expect(response.body.group.tenantId).toBeDefined();
        expect(response.body.roles).toBeDefined();
        return response.body
    }


    public async addUser(groupId: string, users: string[]) {
        const response = await this.app.getHttpServer()
            .post(`/api/group/${groupId}/add-users`)
            .send({
                "users": ["legolas@mail.com"]
            })
            .set('Authorization', `Bearer ${this.accessToken}`)
            .set('Accept', 'application/json');

        console.log("Response: ", response.body);

        expect(response.status).toEqual(201);
        expect(response.body.group).toBeDefined();
        expect(response.body.group.name).toBeDefined();
        expect(response.body.group.tenantId).toBeDefined();
        expect(response.body.users).toBeDefined();
        expect(response.body.users.length).toBeGreaterThanOrEqual(users.length);

        return response.body;


    }

    public async removeUser(groupId: string, users: string[]) {
        const response = await this.app.getHttpServer()
            .post(`/api/group/${groupId}/remove-users`)
            .send({
                "users": ["legolas@mail.com"]
            })
            .set('Authorization', `Bearer ${this.accessToken}`)
            .set('Accept', 'application/json');

        console.log("Response: ", response.body);

        expect(response.status).toEqual(201);
        expect(response.body.group).toBeDefined();
        expect(response.body.group.name).toBeDefined();
        expect(response.body.group.tenantId).toBeDefined();
        expect(response.body.users).toBeDefined();
        expect(response.body.users.length).toBeGreaterThanOrEqual(0);
    }
}
