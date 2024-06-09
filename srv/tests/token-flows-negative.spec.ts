import {TestAppFixture} from "./test-app.fixture";

describe('e2e negative token flow', () => {
    let app: TestAppFixture;
    let refreshToken = "";
    let accessToken = "";
    let clientId = "";
    let clientSecret = "";

    beforeAll(async () => {
        app = await new TestAppFixture().init();
    });

    afterAll(async () => {
        await app.close();
    });

    it(`/POST Wrong Password `, async () => {
        const response = await app.getHttpServer()
            .post('/api/oauth/token')
            .send({
                "grant_type": "password",
                "email": "secure@auth.server.com",
                "password": "wrong-password",
                "domain": "auth.server.com"
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(401);
    });

    it(`/POST Missing Grant Type `, async () => {
        const response = await app.getHttpServer()
            .post('/api/oauth/token')
            .send({
                // "grant_type": "password",
                "email": "secure@auth.server.com",
                "password": "wrong-password",
                "domain": "auth.server.com"
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(400);
    });

    it(`/POST Wrong Grant Type `, async () => {
        const response = await app.getHttpServer()
            .post('/api/oauth/token')
            .send({
                "grant_type": "missing-Grant",
                "email": "secure@auth.server.com",
                "password": "wrong-password",
                "domain": "auth.server.com"
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(400);
    });

    it(`/POST Wrong email `, async () => {
        const response = await app.getHttpServer()
            .post('/api/oauth/token')
            .send({
                "grant_type": "password",
                "email": "wrong-email@sada.cas",
                "password": "wrong-password",
                "domain": "auth.server.com"
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(404);
    });

    it(`/POST Wrong Domain `, async () => {
        const response = await app.getHttpServer()
            .post('/api/oauth/token')
            .send({
                "grant_type": "password",
                "email": "secure@auth.server.com",
                "password": "admin9000",
                "domain": "auth.server.comasda"
            })
            .set('Accept', 'application/json');

        console.log(response.body);
        expect(response.status).toEqual(404);
    });

    it(`/POST Refresh Token Missing Grant Type `, async () => {
        const response = await app.getHttpServer()
            .post('/api/oauth/token')
            .send({
                // "grant_type": "refresh_token",
                "refresh_token": refreshToken,
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(400);
    });

    it(`/POST Refresh Token Null Grant Type `, async () => {
        const response = await app.getHttpServer()
            .post('/api/oauth/token')
            .send({
                "grant_type": null,
                "refresh_token": refreshToken,
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(400);
    });

    it(`/POST Invalid Refresh Token `, async () => {
        const response = await app.getHttpServer()
            .post('/api/oauth/token')
            .send({
                "grant_type": "refresh_token",
                "refresh_token": "auasd",
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(400);
    });

    it(`/POST Null Refresh Token `, async () => {
        const response = await app.getHttpServer()
            .post('/api/oauth/token')
            .send({
                "grant_type": "refresh_token",
                "refresh_token": null,
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(400);
    });

    it(`/POST Wrong Refresh Token Label`, async () => {
        const response = await app.getHttpServer()
            .post('/api/oauth/token')
            .send({
                "grant_type": "refresh_token",
                "refreshToken": "Asfasg",
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(400);
    });

    it(`/POST Client Credentials Missing Grant Type `, async () => {
        const response = await app.getHttpServer()
            .post('/api/oauth/token')
            .send({
                // "grant_type": "client_credential",
                "client_id": clientId,
                "client_secret": clientSecret
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(400);
    });

    it(`/POST Empty Client Credentials`, async () => {
        const response = await app.getHttpServer()
            .post('/api/oauth/token')
            .send({
                "grant_type": "client_credential",
                "client_id": "",
                "client_secret": ""
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(400);
    });

    it(`/POST Wrong Client Credentials`, async () => {
        const response = await app.getHttpServer()
            .post('/api/oauth/token')
            .send({
                "grant_type": "client_credential",
                "client_id": "sadasdasfasf",
                "client_secret": "asfasfasfasfasf"
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(404);
    });

    it(`/POST password Gibberish `, async () => {
        const response = await app.getHttpServer()
            .post('/api/oauth/token')
            .send({
                "grant_type": "password",
                "email": "sdgsdah@safasf.asfasfa",
                "password": "asfasfasf",
                "domain": "tracko.com"
            })
            .set('Accept', 'application/json');

        console.log(response.body)
        expect(response.status).toEqual(404);
    });

    it(`/POST grant_type null Client Credentials`, async () => {
        const response = await app.getHttpServer()
            .post('/api/oauth/token')
            .send({
                "grant_type": null,
                "client_id": "",
                "client_secret": ""
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(400);
    });

    it(`/POST client_id null Client Credentials`, async () => {
        const response = await app.getHttpServer()
            .post('/api/oauth/token')
            .send({
                "grant_type": "client_credential",
                "client_id": null,
                "client_secret": ""
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(400);
    });

    it(`/POST client_secret null Client Credentials`, async () => {
        const response = await app.getHttpServer()
            .post('/api/oauth/token')
            .send({
                "grant_type": "client_credential",
                "client_id": "Asfasf",
                "client_secret": null
            })
            .set('Accept', 'application/json');

        expect(response.status).toEqual(400);
    });

    it(`/POST password is null `, async () => {
        const response = await app.getHttpServer()
            .post('/api/oauth/token')
            .send({
                "grant_type": "password",
                "email": "sdgsdah@safasf.asfasfa",
                "password": null,
                "domain": "tracko.com"
            })
            .set('Accept', 'application/json');

        console.log(response.body)
        expect(response.status).toEqual(400);
    });

    it(`/POST email is null `, async () => {
        const response = await app.getHttpServer()
            .post('/api/oauth/token')
            .send({
                "grant_type": "password",
                "email": null,
                "password": "asfasf",
                "domain": "tracko.com"
            })
            .set('Accept', 'application/json');

        console.log(response.body)
        expect(response.status).toEqual(400);
    });

    it(`/POST domain is null `, async () => {
        const response = await app.getHttpServer()
            .post('/api/oauth/token')
            .send({
                "grant_type": "password",
                "email": "asgasgasg@fsaf.asf",
                "password": "asfasf",
                "domain": null
            })
            .set('Accept', 'application/json');

        console.log(response.body)
        expect(response.status).toEqual(400);
    });

    it(`/POST grant_type is null `, async () => {
        const response = await app.getHttpServer()
            .post('/api/oauth/token')
            .send({
                "grant_type": null,
                "email": "asgasgasg@fsaf.asf",
                "password": "asfasf",
                "domain": "dasdasd"
            })
            .set('Accept', 'application/json');

        console.log(response.body)
        expect(response.status).toEqual(400);
    });

});

