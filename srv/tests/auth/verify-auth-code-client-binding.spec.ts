import {SharedTestFixture} from "../shared-test.fixture";
import {AuthorizeParams, TokenFixture} from "../token.fixture";
import {ClientEntityClient} from "../api-client/client-entity-client";
import {generateAlias} from "../api-client/client";

/**
 * Regression: POST /verify-auth-code must bind the code to the exact client it
 * was issued to, not merely to any client in the same tenant.
 *
 * The endpoint returns the code's associated user email with no client secret,
 * and previously only checked that the code's tenant matched the caller's
 * client. A different (or malicious) client in the same tenant that obtained a
 * code could therefore read the email. The handler now also requires the
 * client_id to match the one the code was issued to (as the token endpoint
 * already does).
 */
describe('verify-auth-code client binding', () => {
    let app: SharedTestFixture;
    let tokenFixture: TokenFixture;
    let clientApi: ClientEntityClient;

    const adminEmail = 'admin@auth.server.com';
    const adminPassword = 'admin9000';
    const defaultClientId = 'auth.server.com';
    const redirectUri = 'http://localhost:3000/callback';
    const verifier = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopq';

    let otherClientId: string;
    let code: string;

    const authorizeParams: AuthorizeParams = {
        clientId: defaultClientId,
        redirectUri,
        scope: 'openid profile email',
        state: 'vac-binding',
        codeChallenge: verifier,
        codeChallengeMethod: 'plain',
    };

    beforeAll(async () => {
        app = new SharedTestFixture();
        tokenFixture = new TokenFixture(app);

        const {accessToken, jwt} = await tokenFixture.fetchAccessTokenFlow(
            adminEmail, adminPassword, defaultClientId,
        );
        clientApi = new ClientEntityClient(app, accessToken);

        // A second client that lives in the SAME (global) tenant as the code
        // below. Its own redirect URI is irrelevant here (we never run a flow
        // through it) — client creation just requires a valid https URL.
        const created = await clientApi.createClient(jwt.tenant.id, 'VAC Binding Other Client', {
            alias: generateAlias('vac-binding-other'),
            redirectUris: ['https://vac-binding-other.example.com/callback'],
            allowedScopes: 'openid profile email',
            isPublic: true,
        });
        otherClientId = created.client.clientId;

        // A code issued to the default client (same tenant as otherClient).
        // verify-auth-code does not consume the code, so both cases can reuse it.
        code = await tokenFixture.fetchAuthCodeWithConsentFlow(
            adminEmail, adminPassword, authorizeParams,
        );
    });

    afterAll(async () => {
        await clientApi.deleteClient(otherClientId).catch(() => {
        });
        await app.close();
    });

    it('returns the email to the client the code was issued to', async () => {
        const res = await app.getHttpServer()
            .post('/api/oauth/verify-auth-code')
            .set('Accept', 'application/json')
            .send({auth_code: code, client_id: defaultClientId});

        expect(res.status).toBe(201);
        expect(res.body.status).toBe(true);
        expect(res.body.email).toBe(adminEmail);
    });

    it('does not leak the email to a different client in the same tenant', async () => {
        const res = await app.getHttpServer()
            .post('/api/oauth/verify-auth-code')
            .set('Accept', 'application/json')
            .send({auth_code: code, client_id: otherClientId});

        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.body.email).toBeUndefined();
    });
});
