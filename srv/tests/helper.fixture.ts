import {TestAppFixture} from "./test-app.fixture";

export class HelperFixture {

    private readonly app: TestAppFixture;
    private accessToken: string;

    constructor(app: TestAppFixture, accessToken: string) {
        this.app = app;
        this.accessToken = accessToken;
    }

    public async createTenant(name: string, domain: string) {
        const response = await this.app.getHttpServer()
            .post('/api/tenant/create')
            .send({
                "name": name,
                "domain": domain
            })
            .set('Authorization', `Bearer ${this.accessToken}`)
            .set('Accept', 'application/json');

        console.log("Response:", response.body);
        expect(response.status).toEqual(201);

        expect(response.body.id).toBeDefined();
        expect(response.body.name).toEqual(name);
        expect(response.body.domain).toEqual(domain);
        expect(response.body.clientId).toBeDefined();
        return response.body;
    }

    public async createRole(name: string, tenantId: string) {
        const response = await this.app.getHttpServer()
            .post(`/api/tenant/${tenantId}/role/${name}`)
            .set('Authorization', `Bearer ${this.accessToken}`)
            .set('Accept', 'application/json');

        console.log(response.body);
        expect(response.status).toEqual(201);
        return response.body;
    }

    public async addMembers(email: string, tenantId: string) {
        // const email = "legolas@mail.com";
        const response = await this.app.getHttpServer()
            .post(`/api/tenant/${tenantId}/member/${email}`)
            .set('Authorization', `Bearer ${this.accessToken}`)
            .set('Accept', 'application/json');

        console.log(response.body);
        expect(response.status).toEqual(201);
    }

    public async getMemberRoles(email: string, tenantId: string) {
        // const email = "legolas@mail.com";
        const response = await this.app.getHttpServer()
            .get(`/api/tenant/${tenantId}/member/${email}/roles`)
            .set('Authorization', `Bearer ${this.accessToken}`)
            .set('Accept', 'application/json');

        console.log("Response: ", response.body);
        expect(response.status).toEqual(200);

        return response.body.roles;
    }

}
