import {SharedTestFixture} from '../shared-test.fixture';
import {TokenFixture} from '../token.fixture';
import {generateAlias} from '../api-client/client';
import {ClientEntityClient} from '../api-client/client-entity-client';

/**
 * Regression test: a public client must not be able to authenticate to the
 * token introspection endpoint with an arbitrary secret.
 *
 * ClientService.validateClientSecret() used to short-circuit to `true` for any
 * public client. The introspection endpoint authenticates callers with that
 * method and no separate isPublic guard, so any public client could read token
 * metadata for its tenant by sending any (or no) secret. validateClientSecret
 * now rejects public clients outright.
 */
describe('introspection auth for public clients', () => {
    let app: SharedTestFixture;
    let publicClientId: string;
    let userAccessToken: string;

    beforeAll(async () => {
        app = new SharedTestFixture();
        const tokenFixture = new TokenFixture(app);

        const tokenResult = await tokenFixture.fetchAccessTokenFlow(
            'admin@auth.server.com',
            'admin9000',
            'auth.server.com',
        );
        userAccessToken = tokenResult.accessToken;
        const tenantId = tokenResult.jwt.tenant.id;

        const clientApi = new ClientEntityClient(app, userAccessToken);
        const created = await clientApi.createClient(tenantId, 'Public Introspection Client', {
            alias: generateAlias('Public Introspection Client'),
            allowedScopes: 'openid profile email',
            grantTypes: 'authorization_code',
            isPublic: true,
        });
        publicClientId = created.client.clientId;
    });

    afterAll(async () => {
        await app.close();
    });

    it('rejects a public client presenting an arbitrary secret', async () => {
        const response = await app.getHttpServer()
            .post('/api/oauth/introspect')
            .send({
                token: userAccessToken,
                client_id: publicClientId,
                client_secret: 'anything-goes-for-a-public-client',
            })
            .set('Accept', 'application/json');

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('invalid_client');
    });

    it('rejects a public client presenting no secret at all', async () => {
        const response = await app.getHttpServer()
            .post('/api/oauth/introspect')
            .send({
                token: userAccessToken,
                client_id: publicClientId,
                client_secret: '',
            })
            .set('Accept', 'application/json');

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('invalid_client');
    });
});
