import {expect2xx, HttpClient, TestFixture} from "./client";

export class RoleClient extends HttpClient {

    constructor(app: TestFixture, accessToken: string) {
        super(app, accessToken);
    }

    public async createRole(name: string, tenantId: string) {
        const response = await this.app.getHttpServer()
            .post(`/api/tenant/my/role/${name}`)
            .set('Authorization', `Bearer ${this.accessToken}`)
            .set('Accept', 'application/json');

        console.log(response.body);
        expect2xx(response);
        return response.body;
    }

    public async addAppOwnedRoles(userId: string, roleIds: string[]): Promise<void> {
        await this.app.getHttpServer()
            .post(`/api/tenant/my/member/${userId}/app-roles/add`)
            .send({roleIds})
            .set('Authorization', `Bearer ${this.accessToken}`)
            .set('Accept', 'application/json')
            .expect(201);
    }

    public async removeAppOwnedRoles(userId: string, roleIds: string[]): Promise<void> {
        await this.app.getHttpServer()
            .delete(`/api/tenant/my/member/${userId}/app-roles/remove`)
            .send({roleIds})
            .set('Authorization', `Bearer ${this.accessToken}`)
            .set('Accept', 'application/json')
            .expect(200);
    }

    public async getAppOwnedRolesForMember(userId: string): Promise<any> {
        const response = await this.app.getHttpServer()
            .get(`/api/tenant/my/member/${userId}/app-roles`)
            .set('Authorization', `Bearer ${this.accessToken}`)
            .set('Accept', 'application/json');
        expect2xx(response);
        return response.body;
    }

    public async getAvailableAppOwnedRoles(): Promise<any> {
        const response = await this.app.getHttpServer()
            .get('/api/tenant/my/app-roles/available')
            .set('Authorization', `Bearer ${this.accessToken}`)
            .set('Accept', 'application/json');
        expect2xx(response);
        return response.body;
    }
}
