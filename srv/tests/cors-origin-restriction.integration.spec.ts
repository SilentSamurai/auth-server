import {SharedTestFixture} from "./shared-test.fixture";
import {TokenFixture} from "./token.fixture";
import {expect2xx} from "./api-client/client";
import {ClientEntityClient} from "./api-client/client-entity-client";
import {TenantClient} from "./api-client/tenant-client";

/**
 * Integration tests for per-client JWT-driven CORS.
 *
 * Validates that:
 * - Token endpoint (/api/oauth/token) sets CORS based on the specific authenticated client's redirect URIs
 * - Authenticated endpoints (/api/oauth/userinfo) set CORS based on the JWT's client_id
 * - Discovery endpoints (/.well-known/*) allow all origins (wildcard CORS)
 * - Preflight (OPTIONS) requests are handled correctly on the token endpoint
 * - Server-to-server requests (no Origin header) are allowed
 * - Per-client isolation: one client's origins don't grant CORS to another client's tokens
 */
describe('CORS origin restriction', () => {
    let app: SharedTestFixture;
    let adminAccessToken: string;
    let clientApi: ClientEntityClient;

    // Test tenant and its built-in credentials (used for client_credentials grant)
    let tenant: { id: string; domain: string };
    let tenantCredentials: { clientId: string; clientSecret: string };

    beforeAll(async () => {
        app = new SharedTestFixture();

        const tokenFixture = new TokenFixture(app);
        const response = await tokenFixture.fetchAccessTokenFlow(
            "admin@auth.server.com",
            "admin9000",
            "auth.server.com",
        );
        adminAccessToken = response.accessToken;
        clientApi = new ClientEntityClient(app, adminAccessToken);

        // Create test tenant
        const tenantClient = new TenantClient(app, adminAccessToken);
        const tenantRes = await tenantClient.createTenant("cors-test-tenant", `cors-test-${Date.now()}.com`);
        tenant = {id: tenantRes.id, domain: tenantRes.domain};

        // Get the tenant's confidential client credentials for client_credentials grant
        const tokenFixtureForCreds = new TokenFixture(app);
        tenantCredentials = await tokenFixtureForCreds.createConfidentialClient(
            adminAccessToken,
            tenant.id,
            'cors-cc-client',
            'client_credentials',
            'openid profile email',
        );

        // Set redirect URIs on the confidential client so per-client CORS works
        // The global CORS middleware has been replaced with per-client JWT-driven CORS:
        // the token endpoint checks the specific client's redirect URIs,
        // and authenticated endpoints check the JWT's client_id.
        await clientApi.updateClient(tenantCredentials.clientId, {
            redirectUris: [
                "https://app.example.com/callback",
                "https://app.example.com/silent-renew",
                "http://dev.example.com:4200/callback"
            ],
        });
    });

    afterAll(async () => {
        await app.close();
    });

    // ─── Token endpoint: matching origin ───

    it('should return Access-Control-Allow-Origin header for /api/oauth/token with matching origin', async () => {
        const res = await app.getHttpServer()
            .post('/api/oauth/token')
            .send({
                grant_type: "client_credentials",
                client_id: tenantCredentials.clientId,
                client_secret: tenantCredentials.clientSecret
            })
            .set('Origin', 'https://app.example.com')
            .set('Accept', 'application/json');

        expect2xx(res);
        expect(res.headers['access-control-allow-origin']).toEqual('https://app.example.com');
    });

    // ─── Token endpoint: non-matching origin ───

    it('should omit Access-Control-Allow-Origin header for /api/oauth/token with non-matching origin', async () => {
        const res = await app.getHttpServer()
            .post('/api/oauth/token')
            .send({
                grant_type: "client_credentials",
                client_id: tenantCredentials.clientId,
                client_secret: tenantCredentials.clientSecret
            })
            .set('Origin', 'https://evil.example.com')
            .set('Accept', 'application/json');

        expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    // ─── OPTIONS preflight on token endpoint: wildcard CORS ───

    it('should return Access-Control-Allow-Origin: * for OPTIONS /api/oauth/token with any origin', async () => {
        const res = await app.getHttpServer()
            .options('/api/oauth/token')
            .set('Origin', 'https://evil.example.com')
            .set('Access-Control-Request-Method', 'POST')
            .set('Access-Control-Request-Headers', 'Content-Type,Authorization');

        expect(res.status).toEqual(204);
        expect(res.headers['access-control-allow-origin']).toEqual('*');
        expect(res.headers['access-control-allow-methods']).toBeDefined();
    });

    // ─── UserInfo endpoint with matching origin (via JWT interceptor) ───

    it('should return Access-Control-Allow-Origin header for /api/oauth/userinfo with matching origin', async () => {
        const tokenFixture = new TokenFixture(app);
        const tokenRes = await tokenFixture.fetchClientCredentialsTokenFlow(
            tenantCredentials.clientId,
            tenantCredentials.clientSecret
        );

        const res = await app.getHttpServer()
            .get('/api/oauth/userinfo')
            .set('Authorization', `Bearer ${tokenRes.accessToken}`)
            .set('Origin', 'https://app.example.com')
            .set('Accept', 'application/json');

        // CORS is set by CorsInterceptor based on the JWT's client_id
        expect(res.headers['access-control-allow-origin']).toEqual('https://app.example.com');
    });

    // ─── UserInfo endpoint with non-matching origin (via JWT interceptor) ───

    it('should omit Access-Control-Allow-Origin header for /api/oauth/userinfo with non-matching origin', async () => {
        const tokenFixture = new TokenFixture(app);
        const tokenRes = await tokenFixture.fetchClientCredentialsTokenFlow(
            tenantCredentials.clientId,
            tenantCredentials.clientSecret
        );

        const res = await app.getHttpServer()
            .get('/api/oauth/userinfo')
            .set('Authorization', `Bearer ${tokenRes.accessToken}`)
            .set('Origin', 'https://evil.example.com')
            .set('Accept', 'application/json');

        expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    // ─── Per-client isolation: different client, same origin ───

    it('should NOT grant CORS when token is issued by a different client without matching redirect URIs', async () => {
        // Create another confidential client WITHOUT the test redirect URIs
        const tokenFixture = new TokenFixture(app);
        const otherCreds = await tokenFixture.createConfidentialClient(
            adminAccessToken,
            tenant.id,
            'other-cc-client',
            'client_credentials',
            'openid profile email',
        );

        const tokenRes = await tokenFixture.fetchClientCredentialsTokenFlow(
            otherCreds.clientId,
            otherCreds.clientSecret
        );

        // This token was issued by 'other-cc-client' which has no redirect URIs
        // -> CORS should NOT be set for any origin
        const res = await app.getHttpServer()
            .get('/api/oauth/userinfo')
            .set('Authorization', `Bearer ${tokenRes.accessToken}`)
            .set('Origin', 'https://app.example.com')
            .set('Accept', 'application/json');

        expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    // ─── Discovery endpoint wildcard CORS ───

    it('should return Access-Control-Allow-Origin: * for discovery endpoint with any origin', async () => {
        const res = await app.getHttpServer()
            .get(`/${tenant.domain}/.well-known/openid-configuration`)
            .set('Origin', 'https://random-origin.example.com')
            .set('Accept', 'application/json');

        expect(res.status).toEqual(200);
        expect(res.headers['access-control-allow-origin']).toEqual('*');
    });

    // ─── JWKS endpoint wildcard CORS ───

    it('should return Access-Control-Allow-Origin: * for JWKS endpoint with any origin', async () => {
        const res = await app.getHttpServer()
            .get(`/${tenant.domain}/.well-known/jwks.json`)
            .set('Origin', 'https://random-origin.example.com')
            .set('Accept', 'application/json');

        expect(res.status).toEqual(200);
        expect(res.headers['access-control-allow-origin']).toEqual('*');
    });

    // ─── Discovery preflight ───

    it('should return wildcard CORS headers for OPTIONS on discovery endpoint', async () => {
        const res = await app.getHttpServer()
            .options(`/${tenant.domain}/.well-known/openid-configuration`)
            .set('Origin', 'https://random-origin.example.com')
            .set('Access-Control-Request-Method', 'GET');

        expect(res.status).toBeLessThan(300);
        expect(res.headers['access-control-allow-origin']).toEqual('*');
        expect(res.headers['access-control-allow-methods']).toBeDefined();
    });

    // ─── Non-default port in origin ───

    it('should accept http://dev.example.com:4200 as origin for client with http://dev.example.com:4200/callback redirect URI', async () => {
        const res = await app.getHttpServer()
            .post('/api/oauth/token')
            .send({
                grant_type: "client_credentials",
                client_id: tenantCredentials.clientId,
                client_secret: tenantCredentials.clientSecret
            })
            .set('Origin', 'http://dev.example.com:4200')
            .set('Accept', 'application/json');

        expect2xx(res);
        expect(res.headers['access-control-allow-origin']).toEqual('http://dev.example.com:4200');
    });

    // ─── Multiple redirect URIs same origin ───

    it('should accept origin when client has multiple redirect URIs with same origin (deduplication)', async () => {
        const res = await app.getHttpServer()
            .post('/api/oauth/token')
            .send({
                grant_type: "client_credentials",
                client_id: tenantCredentials.clientId,
                client_secret: tenantCredentials.clientSecret
            })
            .set('Origin', 'https://app.example.com')
            .set('Accept', 'application/json');

        expect2xx(res);
        expect(res.headers['access-control-allow-origin']).toEqual('https://app.example.com');
    });

    // ─── No origin header (server-to-server) ───

    it('should allow request without Origin header (server-to-server)', async () => {
        const res = await app.getHttpServer()
            .post('/api/oauth/token')
            .send({
                grant_type: "client_credentials",
                client_id: tenantCredentials.clientId,
                client_secret: tenantCredentials.clientSecret
            })
            .set('Accept', 'application/json');

        expect2xx(res);
        expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
});
