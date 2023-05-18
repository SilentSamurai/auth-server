import {TestAppFixture} from "./test-app.fixture";

describe('e2e positive auth code flow', () => {
    let app: TestAppFixture;
    let authentication_code = "";
    let accessToken = "";
    let clientId = "";
    let clientSecret = "";
    const verifier = "OrxPz3wFm0oRnjQvYI_lZiLz1KUdNGy2GreFNGCbiA0";
    const challenge = "bJXNTelxbEYiDtO7MHN94-q9UOFM7wC-UtPRUjoUQ4k";

    beforeAll(async () => {
        app = await new TestAppFixture().init();
    });

    afterAll(async () => {
        await app.close();
    });

    it(`/POST login `, async () => {
        const response = await app.getHttpServer()
            .post('/api/oauth/login')
            .send({
                "code_challenge": challenge,
                "email": "admin@auth.server.com",
                "password": "admin9000",
                "domain": "auth.server.com"
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(201);
        expect(response.body.authentication_code).toBeDefined();
        authentication_code = response.body.authentication_code;
    });

    it(`/POST Fetch Access Token`, async () => {
        const response = await app.getHttpServer()
            .post('/api/oauth/token')
            .send({
                "grant_type": "authorization_code",
                "code": authentication_code,
                "code_verifier": verifier
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(201);
        expect(response.body.access_token).toBeDefined();
        expect(response.body.expires_in).toBeDefined();
        expect(response.body.token_type).toEqual('Bearer');
        expect(response.body.refresh_token).toBeDefined();

        accessToken = response.body.access_token;
    });


    it(`/POST Fetch auth gen code`, async () => {
        const response = await app.getHttpServer()
            .post('/api/oauth/gen-auth-code')
            .send({
                "access_token": accessToken,
                "code_challenge": challenge,
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(201);
        expect(response.body.authentication_code).toBeDefined();
    });


});

