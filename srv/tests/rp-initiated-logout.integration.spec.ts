import {SharedTestFixture} from "./shared-test.fixture";
import {TokenFixture} from "./token.fixture";
import {expect2xx} from "./api-client/client";
import {ClientEntityClient} from "./api-client/client-entity-client";
import {TenantClient} from "./api-client/tenant-client";
import {AdminTenantClient} from "./api-client/admin-tenant-client";

/**
 * Integration tests for RP-Initiated Logout (OIDC RP-Initiated Logout 1.0).
 *
 * Validates the GET /api/oauth/logout endpoint behaves per spec:
 *   - end_session_endpoint is advertised in discovery
 *   - id_token_hint and/or client_id are required
 *   - id_token_hint is validated for signature, audience, and structure
 *   - post_logout_redirect_uri is validated against client's registered URIs
 *   - state parameter is preserved through the redirect
 */
describe('RP-Initiated Logout', () => {
    let app: SharedTestFixture;
    let tokenFixture: TokenFixture;
    let adminAccessToken: string;

    let testTenant: { id: string; domain: string };
    let testUserEmail: string;
    const TEST_PASSWORD = 'admin9000';
    const REDIRECT_URI = 'https://rp-logout-test.example.com/callback';
    const CODE_VERIFIER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopq';

    // Client used for RP-Initiated Logout tests
    let testClient: { id: string; clientId: string };

    /** Full auth code flow to obtain an ID token for id_token_hint tests */
    async function getIdToken(clientId: string): Promise<string> {
        const code = await tokenFixture.fetchAuthCodeWithConsentFlow(
            testUserEmail, TEST_PASSWORD, {
                clientId,
                redirectUri: REDIRECT_URI,
                scope: 'openid profile email',
                state: 'logout-test-state',
                codeChallenge: CODE_VERIFIER,
                codeChallengeMethod: 'plain',
            },
        );

        const res = await app.getHttpServer()
            .post('/api/oauth/token')
            .send({
                grant_type: 'authorization_code',
                code,
                code_verifier: CODE_VERIFIER,
                client_id: clientId,
                redirect_uri: REDIRECT_URI,
            })
            .set('Accept', 'application/json');

        expect2xx(res);
        expect(res.body.id_token).toBeDefined();
        return res.body.id_token;
    }

    beforeAll(async () => {
        app = new SharedTestFixture();
        tokenFixture = new TokenFixture(app);

        // Super admin token for tenant/client setup
        const authRes = await tokenFixture.fetchAccessTokenFlow(
            'admin@auth.server.com',
            'admin9000',
            'auth.server.com',
        );
        adminAccessToken = authRes.accessToken;

        const adminTenantClient = new AdminTenantClient(app, adminAccessToken);
        const tenantClient = new TenantClient(app, adminAccessToken);

        // Create a dedicated tenant for this test suite
        const domain = `rp-logout-${Date.now()}.com`;
        testTenant = await tenantClient.createTenant('rp-logout-test', domain);

        // Create a test user in the tenant
        testUserEmail = `rp-logout-user-${Date.now()}@example.com`;
        const addResult = await adminTenantClient.addMembers(testTenant.id, [testUserEmail]);
        const testUserId = addResult.members.find((m: any) => m.email === testUserEmail).id;
        await adminTenantClient.updateMemberRoles(testTenant.id, testUserId, ['TENANT_VIEWER']);

        // Set the user's password and verify them
        await app.getHttpServer()
            .put(`/api/users/${testUserId}/password`)
            .set('Authorization', `Bearer ${adminAccessToken}`)
            .set('Accept', 'application/json')
            .send({password: TEST_PASSWORD, confirmPassword: TEST_PASSWORD});
        await app.getHttpServer()
            .put('/api/users/verify-user')
            .set('Authorization', `Bearer ${adminAccessToken}`)
            .set('Accept', 'application/json')
            .send({email: testUserEmail, verify: true});

        // Create a client for RP-Initiated Logout tests with registered redirect URI
        const clientApi = new ClientEntityClient(app, adminAccessToken);
        const created = await clientApi.createClient(testTenant.id, 'RP Logout Test Client', {
            redirectUris: [REDIRECT_URI],
            allowedScopes: 'openid profile email',
            isPublic: true,
        });
        testClient = {id: created.client.id, clientId: created.client.clientId};

        // Pre-grant consent so auth code flow works without interactive consent
        await tokenFixture.preGrantConsentFlow(testUserEmail, TEST_PASSWORD, {
            clientId: testClient.clientId,
            redirectUri: REDIRECT_URI,
            scope: 'openid profile email',
            state: 'consent-state',
            codeChallenge: CODE_VERIFIER,
            codeChallengeMethod: 'plain',
        });
    });

    afterAll(async () => {
        await app.close();
    });

    // ─── Requirement 1: end_session_endpoint advertised in discovery ───

    it('should advertise end_session_endpoint in discovery document', async () => {
        const res = await app.getHttpServer()
            .get(`/${testTenant.domain}/.well-known/openid-configuration`);

        expect(res.status).toEqual(200);
        expect(res.body.end_session_endpoint).toBeDefined();
        expect(res.body.end_session_endpoint).toMatch(/\/api\/oauth\/logout$/);
    });

    // ─── Requirement 2: At least one of id_token_hint or client_id required ───

    it('should return 400 when neither id_token_hint nor client_id is provided', async () => {
        const res = await app.getHttpServer()
            .get('/api/oauth/logout')
            .redirects(0);

        expect(res.status).toEqual(400);
        expect(res.body.error).toEqual('invalid_request');
    });

    // ─── Requirement 3: Valid id_token_hint results in 302 redirect to UI ───

    it('should return 302 with valid id_token_hint alone (no client_id)', async () => {
        const idToken = await getIdToken(testClient.clientId);

        const res = await app.getHttpServer()
            .get(`/api/oauth/logout?id_token_hint=${encodeURIComponent(idToken)}`)
            .redirects(0);

        expect(res.status).toEqual(302);
        const location = res.headers['location'] || '';
        expect(location).toContain('/logout');
    });

    // ─── Requirement 4: Invalid id_token_hint returns 400 ───

    it('should return 400 with invalid id_token_hint (malformed JWT)', async () => {
        const res = await app.getHttpServer()
            .get('/api/oauth/logout?id_token_hint=invalid.jwt.token')
            .redirects(0);

        expect(res.status).toEqual(400);
        expect(res.body.error).toEqual('invalid_request');
    });

    it('should return 400 with id_token_hint from a different client', async () => {
        // Create a second client to get an ID token issued for a different client
        const clientApi = new ClientEntityClient(app, adminAccessToken);
        const otherClient = await clientApi.createClient(testTenant.id, 'Other RP Logout Client', {
            redirectUris: ['https://other.example.com/callback'],
            allowedScopes: 'openid profile email',
            isPublic: true,
        });

        await tokenFixture.preGrantConsentFlow(testUserEmail, TEST_PASSWORD, {
            clientId: otherClient.client.clientId,
            redirectUri: 'https://other.example.com/callback',
            scope: 'openid profile email',
            state: 'consent-state',
            codeChallenge: CODE_VERIFIER,
            codeChallengeMethod: 'plain',
        });

        // Get id_token for the other client
        const otherCode = await tokenFixture.fetchAuthCodeWithConsentFlow(
            testUserEmail, TEST_PASSWORD, {
                clientId: otherClient.client.clientId,
                redirectUri: 'https://other.example.com/callback',
                scope: 'openid profile email',
                state: 'logout-test-state',
                codeChallenge: CODE_VERIFIER,
                codeChallengeMethod: 'plain',
            },
        );

        const otherTokenRes = await app.getHttpServer()
            .post('/api/oauth/token')
            .send({
                grant_type: 'authorization_code',
                code: otherCode,
                code_verifier: CODE_VERIFIER,
                client_id: otherClient.client.clientId,
                redirect_uri: 'https://other.example.com/callback',
            })
            .set('Accept', 'application/json');
        expect2xx(otherTokenRes);

        const otherIdToken = otherTokenRes.body.id_token;
        expect(otherIdToken).toBeDefined();

        // Pass test client's client_id but other client's id_token — should fail
        const res = await app.getHttpServer()
            .get(`/api/oauth/logout?client_id=${testClient.clientId}&id_token_hint=${encodeURIComponent(otherIdToken)}`)
            .redirects(0);

        expect(res.status).toEqual(400);
        expect(res.body.error).toEqual('invalid_request');

        // Cleanup
        await clientApi.deleteClient(otherClient.client.clientId).catch(() => {});
    });

    // ─── Requirement 5: Valid client_id with valid post_logout_redirect_uri ───

    it('should return 302 with valid client_id and matching post_logout_redirect_uri', async () => {
        const res = await app.getHttpServer()
            .get(`/api/oauth/logout?client_id=${testClient.clientId}&post_logout_redirect_uri=${encodeURIComponent(REDIRECT_URI)}`)
            .redirects(0);

        expect(res.status).toEqual(302);
        const location = res.headers['location'] || '';
        expect(location).toContain('/logout');
        expect(location).toContain(encodeURIComponent(REDIRECT_URI));
    });

    // ─── Requirement 6: Unregistered post_logout_redirect_uri returns 400 ───

    it('should return 400 with unregistered post_logout_redirect_uri', async () => {
        const res = await app.getHttpServer()
            .get(`/api/oauth/logout?client_id=${testClient.clientId}&post_logout_redirect_uri=${encodeURIComponent('https://evil.example.com/hack')}`)
            .redirects(0);

        expect(res.status).toEqual(400);
        expect(res.body.error).toEqual('invalid_request');
    });

    // ─── Requirement 7: state parameter preserved through redirect ───

    it('should preserve state parameter through the redirect', async () => {
        const testState = 'my-test-state-value-123';

        const res = await app.getHttpServer()
            .get(`/api/oauth/logout?client_id=${testClient.clientId}&state=${encodeURIComponent(testState)}`)
            .redirects(0);

        expect(res.status).toEqual(302);
        const locationUrl = new URL(res.headers['location'], 'http://localhost');
        expect(locationUrl.searchParams.get('state')).toEqual(testState);
    });

    // ─── Requirement 8: client_id without id_token_hint succeeds ───

    it('should return 302 with only client_id (no id_token_hint)', async () => {
        const res = await app.getHttpServer()
            .get(`/api/oauth/logout?client_id=${testClient.clientId}`)
            .redirects(0);

        expect(res.status).toEqual(302);
        const location = res.headers['location'] || '';
        expect(location).toContain('/logout');
    });

    // ─── Requirement 9: client_id with id_token_hint both provided and match ───

    it('should return 302 with valid client_id and matching id_token_hint', async () => {
        const idToken = await getIdToken(testClient.clientId);

        const res = await app.getHttpServer()
            .get(`/api/oauth/logout?client_id=${testClient.clientId}&id_token_hint=${encodeURIComponent(idToken)}`)
            .redirects(0);

        expect(res.status).toEqual(302);
        const location = res.headers['location'] || '';
        expect(location).toContain('/logout');
    });
});
