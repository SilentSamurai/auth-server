import {SharedTestFixture} from "../shared-test.fixture";

/**
 * Regression: reset-password and change-email confirmation must reject a token
 * that is not even a well-formed JWT with a clean 401, not a 500.
 *
 * Both handlers decode the token (unverified) to discover which user's secret
 * to verify against. `jwt.decode` returns null for an unparseable token, and
 * the code used to dereference that null (`payload.sub`) → uncaught TypeError →
 * 500. The decode is now guarded.
 */
describe('malformed reset/change-email token handling', () => {
    let app: SharedTestFixture;

    beforeAll(() => {
        app = new SharedTestFixture();
    });

    afterAll(async () => {
        await app.close();
    });

    it('reset-password returns 401 (not 500) for a token that is not a JWT', async () => {
        const res = await app.getHttpServer()
            .post('/api/oauth/reset-password/not-a-jwt')
            .set('Accept', 'application/json')
            .send({password: 'ResetPassw0rd'});

        expect(res.status).toBe(401);
    });

    it('change-email returns 401 (not 500) for a token that is not a JWT', async () => {
        const res = await app.getHttpServer()
            .get('/api/oauth/change-email/not-a-jwt')
            .set('Accept', 'application/json');

        expect(res.status).toBe(401);
    });
});
