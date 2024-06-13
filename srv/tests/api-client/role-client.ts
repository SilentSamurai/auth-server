import {TestAppFixture} from "../test-app.fixture";

export class RoleClient {

    private readonly app: TestAppFixture;
    private accessToken: string;

    constructor(app: TestAppFixture, accessToken: string) {
        this.app = app;
        this.accessToken = accessToken;
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
}
