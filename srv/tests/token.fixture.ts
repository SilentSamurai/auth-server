import {TestAppFixture} from "./test-app.fixture";

export class TokenFixture {

    private readonly app: TestAppFixture;

    constructor(app: TestAppFixture) {
        this.app = app;
    }

    public async fetchAccessToken(email: string, password: string, domain: string): Promise<{ accessToken, refreshToken, jwt }> {
        const response = await this.app.getHttpServer()
            .post('/api/oauth/token')
            .send({
                "grant_type": "password",
                "email": email,
                "password": password,
                "domain": domain
            })
            .set('Accept', 'application/json');

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


}
