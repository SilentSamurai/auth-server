import {TestAppFixture} from "./test-app.fixture";

export class TokenFixture {

    private readonly app: TestAppFixture;

    constructor(app: TestAppFixture) {
        this.app = app;
    }

    public async fetchAccessToken(username: string, password: string, client_id: string): Promise<{
        accessToken,
        refreshToken,
        jwt
    }> {
        const response = await this.app.getHttpServer()
            .post('/api/oauth/token')
            .send({
                "grant_type": "password",
                "username": username,
                "password": password,
                "client_id": client_id
            })
            .set('Accept', 'application/json');

        console.log(response.body);
        expect(response.status).toEqual(201);
        expect(response.body.access_token).toBeDefined();
        expect(response.body.expires_in).toBeDefined();
        expect(response.body.token_type).toEqual('Bearer');
        expect(response.body.refresh_token).toBeDefined();

        let decode = this.app.jwtService().decode(response.body.access_token, {json: true}) as any;
        expect(decode.sub).toBeDefined();
        expect(decode.email).toBeDefined();
        expect(decode.name).toBeDefined();
        expect(decode.grant_type).toBeDefined();
        expect(decode.tenant.id).toBeDefined();
        expect(decode.tenant.name).toBeDefined();
        expect(decode.tenant.domain).toBeDefined();

        return {
            accessToken: response.body.access_token,
            refreshToken: response.body.refresh_token,
            jwt: decode
        }
    }


    public async getUser(email: string, password: string) {
        const token = await this.fetchAccessToken(
            email,
            password,
            "auth.server.com"
        );
        const response = await this.app.getHttpServer()
            .get("/api/users/me")
            .set('Authorization', `Bearer ${token.accessToken}`)
            .set('Accept', 'application/json');

        expect(response.status).toEqual(200);
        console.log(response.body);
        return response.body;
    }


}
