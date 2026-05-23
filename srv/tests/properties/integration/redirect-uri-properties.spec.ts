import * as fc from 'fast-check';
import {AuthorizeService} from '../../../src/auth/authorize.service';
import {Client} from '../../../src/entity/client.entity';
import {OAuthException} from '../../../src/exceptions/oauth-exception';
import {AdminTenantClient} from '../../api-client/admin-tenant-client';
import {ClientEntityClient} from '../../api-client/client-entity-client';
import {TenantClient} from '../../api-client/tenant-client';
import {SharedTestFixture} from '../../shared-test.fixture';
import {TokenFixture} from '../../token.fixture';
import {generateAlias} from '../../api-client/client';

/**
 * Feature: redirect-uri-validation, Property 1: Redirect URI validation accepts iff URI is in registered set
 *
 * For any Client with a set of registered redirect URIs and for any redirect_uri string,
 * the validateRedirectUri function SHALL accept the URI if and only if it is an exact
 * member of the client's registered URI set.
 *
 * Validates: Requirements 1.1, 1.2, 2.1, 2.2
 */
describe('Feature: redirect-uri-validation, Property 1: Redirect URI validation accepts iff URI is in registered set', () => {
    // Instantiate AuthorizeService with null deps — validateRedirectUri is pure and doesn't use them
    const service = new AuthorizeService(null as any, null as any, null as any);

    // Generator: arbitrary URI-like strings for redirect URIs
    const uriArb = fc.oneof(
        fc.webUrl(),
        fc.string({minLength: 1, maxLength: 200}),
    );

    // Generator: a non-empty array of unique URI strings (the registered set)
    const registeredUrisArb = fc.uniqueArray(uriArb, {minLength: 1, maxLength: 10});

    // Build a minimal Client object with the given redirectUris
    function makeClient(redirectUris: string[]): Client {
        const client = new Client();
        client.redirectUris = redirectUris;
        return client;
    }

    it('accepts a redirect_uri that is in the registered set and returns it unchanged', () => {
        fc.assert(
            fc.property(
                registeredUrisArb,
                fc.nat({max: 9}),
                (registeredUris, indexRaw) => {
                    // Pick a URI from the registered set using modular index
                    const chosenUri = registeredUris[indexRaw % registeredUris.length];
                    const client = makeClient(registeredUris);
                    const result = service.validateRedirectUri(client, chosenUri);
                    expect(result).toEqual(chosenUri);
                },
            ),
            {numRuns: 200},
        );
    });

    it('rejects a redirect_uri that is NOT in the registered set with invalid_request', () => {
        fc.assert(
            fc.property(
                registeredUrisArb,
                uriArb,
                (registeredUris, candidateUri) => {
                    // Only test when the candidate is NOT in the registered set
                    fc.pre(!registeredUris.includes(candidateUri));

                    const client = makeClient(registeredUris);
                    expect(() => service.validateRedirectUri(client, candidateUri)).toThrow(OAuthException);
                    try {
                        service.validateRedirectUri(client, candidateUri);
                    } catch (e) {
                        expect((e as OAuthException).errorCode).toEqual('invalid_request');
                    }
                },
            ),
            {numRuns: 200},
        );
    });

    it('biconditional: validateRedirectUri succeeds iff uri is in client.redirectUris', () => {
        fc.assert(
            fc.property(
                registeredUrisArb,
                uriArb,
                (registeredUris, candidateUri) => {
                    const client = makeClient(registeredUris);
                    const isInSet = registeredUris.includes(candidateUri);

                    let accepted: boolean;
                    let returnedUri: string | undefined;
                    try {
                        returnedUri = service.validateRedirectUri(client, candidateUri);
                        accepted = true;
                    } catch {
                        accepted = false;
                    }

                    // Biconditional: accepted ↔ isInSet
                    expect(accepted).toEqual(isInSet);

                    // When accepted, the returned URI must be the exact input
                    if (accepted) {
                        expect(returnedUri).toEqual(candidateUri);
                    }
                },
            ),
            {numRuns: 200},
        );
    });
});

/**
 * Feature: redirect-uri-validation, Property 2: Omitted redirect_uri resolves correctly based on registered URI count
 *
 * For any Client with N registered redirect URIs where the redirect_uri parameter is omitted:
 * if N = 1, the validation SHALL return that single registered URI;
 * if N = 0 or N > 1, the validation SHALL reject with `invalid_request`.
 *
 * Validates: Requirements 1.3, 1.4, 1.5
 */
describe('Feature: redirect-uri-validation, Property 2: Omitted redirect_uri resolves correctly based on registered URI count', () => {
    const service = new AuthorizeService(null as any, null as any, null as any);

    // Generator: arbitrary URI-like strings
    const uriArb = fc.oneof(
        fc.webUrl(),
        fc.string({minLength: 1, maxLength: 200}),
    );

    function makeClient(redirectUris: string[]): Client {
        const client = new Client();
        client.redirectUris = redirectUris;
        return client;
    }

    it('returns the single registered URI when client has exactly one and redirect_uri is omitted', () => {
        fc.assert(
            fc.property(
                uriArb,
                (singleUri) => {
                    const client = makeClient([singleUri]);
                    const result = service.validateRedirectUri(client, undefined);
                    expect(result).toEqual(singleUri);
                },
            ),
            {numRuns: 200},
        );
    });

    it('throws invalid_request when client has zero registered URIs and redirect_uri is omitted', () => {
        const client = makeClient([]);
        expect(() => service.validateRedirectUri(client, undefined)).toThrow(OAuthException);
        try {
            service.validateRedirectUri(client, undefined);
        } catch (e) {
            expect((e as OAuthException).errorCode).toEqual('invalid_request');
        }
    });

    it('throws invalid_request when client has more than one registered URI and redirect_uri is omitted', () => {
        fc.assert(
            fc.property(
                fc.uniqueArray(uriArb, {minLength: 2, maxLength: 10}),
                (registeredUris) => {
                    const client = makeClient(registeredUris);
                    expect(() => service.validateRedirectUri(client, undefined)).toThrow(OAuthException);
                    try {
                        service.validateRedirectUri(client, undefined);
                    } catch (e) {
                        expect((e as OAuthException).errorCode).toEqual('invalid_request');
                    }
                },
            ),
            {numRuns: 200},
        );
    });

    it('biconditional: omitted redirect_uri succeeds iff client has exactly one registered URI', () => {
        fc.assert(
            fc.property(
                fc.uniqueArray(uriArb, {minLength: 0, maxLength: 10}),
                (registeredUris) => {
                    const client = makeClient(registeredUris);
                    const hasExactlyOne = registeredUris.length === 1;

                    let accepted: boolean;
                    let returnedUri: string | undefined;
                    try {
                        returnedUri = service.validateRedirectUri(client, undefined);
                        accepted = true;
                    } catch {
                        accepted = false;
                    }

                    // Biconditional: accepted ↔ exactly one registered URI
                    expect(accepted).toEqual(hasExactlyOne);

                    // When accepted, the returned URI must be the single registered URI
                    if (accepted) {
                        expect(returnedUri).toEqual(registeredUris[0]);
                    }
                },
            ),
            {numRuns: 200},
        );
    });
});

/**
 * Feature: redirect-uri-validation, Property 7: No URI normalization — textually different URIs are always non-matching
 *
 * For any registered redirect URI and for any transformation that changes the string
 * representation while preserving semantic equivalence (case change, trailing slash
 * addition/removal, percent-encoding variation, query parameter reordering), the
 * transformed URI SHALL be rejected as non-matching.
 *
 * Validates: Requirements 6.1, 6.2
 */
describe('Feature: redirect-uri-validation, Property 7: No URI normalization — textually different URIs are always non-matching', () => {
    const service = new AuthorizeService(null as any, null as any, null as any);

    function makeClient(redirectUris: string[]): Client {
        const client = new Client();
        client.redirectUris = redirectUris;
        return client;
    }

    // --- Semantic-preserving transformations ---

    /** Change scheme and/or host to uppercase (semantically equivalent per RFC 3986 §3.1, §3.2.2) */
    function applyCaseChange(uri: string): string {
        try {
            const url = new URL(uri);
            // Uppercase the scheme portion and host
            return uri.replace(url.protocol, url.protocol.toUpperCase())
                .replace(url.hostname, url.hostname.toUpperCase());
        } catch {
            // Fallback: just uppercase the whole thing
            return uri.toUpperCase();
        }
    }

    /** Toggle trailing slash on the path */
    function toggleTrailingSlash(uri: string): string {
        try {
            const url = new URL(uri);
            if (url.pathname.endsWith('/') && url.pathname.length > 1) {
                url.pathname = url.pathname.slice(0, -1);
            } else {
                url.pathname = url.pathname + '/';
            }
            return url.toString();
        } catch {
            return uri.endsWith('/') ? uri.slice(0, -1) : uri + '/';
        }
    }

    /** Percent-encode a character that doesn't need encoding (e.g., 'a' → '%61') */
    function addUnnecessaryPercentEncoding(uri: string): string {
        // Find the first lowercase letter in the path portion and percent-encode it
        try {
            const url = new URL(uri);
            const path = url.pathname;
            for (let i = 0; i < path.length; i++) {
                const ch = path[i];
                if (/[a-z]/.test(ch)) {
                    const encoded = '%' + ch.charCodeAt(0).toString(16).toUpperCase();
                    url.pathname = path.substring(0, i) + encoded + path.substring(i + 1);
                    return url.toString();
                }
            }
            // No lowercase letter in path — encode in the host
            const host = url.hostname;
            for (let i = 0; i < host.length; i++) {
                const ch = host[i];
                if (/[a-z]/.test(ch)) {
                    const encoded = '%' + ch.charCodeAt(0).toString(16).toUpperCase();
                    // Manually replace in the full URI string since URL object normalizes host
                    return uri.replace(host, host.substring(0, i) + encoded + host.substring(i + 1));
                }
            }
        } catch {
            // Non-URL string: encode first lowercase letter
            for (let i = 0; i < uri.length; i++) {
                const ch = uri[i];
                if (/[a-z]/.test(ch)) {
                    const encoded = '%' + ch.charCodeAt(0).toString(16).toUpperCase();
                    return uri.substring(0, i) + encoded + uri.substring(i + 1);
                }
            }
        }
        // Last resort: just append a percent-encoded 'a'
        return uri + '%61';
    }

    /** Reorder query parameters (semantically equivalent for most servers) */
    function reorderQueryParams(uri: string): string {
        try {
            const url = new URL(uri);
            const params = Array.from(url.searchParams.entries());
            if (params.length < 2) {
                // Can't reorder with fewer than 2 params — add a no-op reversal marker
                return uri;
            }
            // Reverse the parameter order
            url.search = '';
            for (const [key, value] of params.reverse()) {
                url.searchParams.append(key, value);
            }
            return url.toString();
        } catch {
            return uri;
        }
    }

    // Transformation descriptor: name + function
    const transformations: Array<{ name: string; fn: (uri: string) => string }> = [
        {name: 'case change', fn: applyCaseChange},
        {name: 'trailing slash toggle', fn: toggleTrailingSlash},
        {name: 'unnecessary percent-encoding', fn: addUnnecessaryPercentEncoding},
        {name: 'query param reorder', fn: reorderQueryParams},
    ];

    // Generator: well-formed web URLs that give transformations something to work with
    const baseUriArb = fc.oneof(
        fc.webUrl(),
        fc.webUrl().map(url => url + '?foo=1&bar=2'),           // URL with query params
        fc.webUrl().map(url => url + '/somepath'),               // URL with a path segment
        fc.webUrl().map(url => url + '/path?a=1&b=2&c=3'),      // URL with path + query
    );

    // Generator: pick a transformation index
    const transformIndexArb = fc.nat({max: transformations.length - 1});

    it('rejects semantically equivalent but textually different URIs (all transformations)', () => {
        fc.assert(
            fc.property(
                baseUriArb,
                transformIndexArb,
                (registeredUri, transformIdx) => {
                    const transformation = transformations[transformIdx];
                    const transformedUri = transformation.fn(registeredUri);

                    // Only test when the transformation actually changed the string
                    fc.pre(transformedUri !== registeredUri);

                    const client = makeClient([registeredUri]);

                    // The transformed URI must be rejected — no normalization
                    expect(() => service.validateRedirectUri(client, transformedUri)).toThrow(OAuthException);
                    try {
                        service.validateRedirectUri(client, transformedUri);
                    } catch (e) {
                        expect((e as OAuthException).errorCode).toEqual('invalid_request');
                    }
                },
            ),
            {numRuns: 200},
        );
    });

    it('case-changed URIs are always rejected', () => {
        fc.assert(
            fc.property(
                baseUriArb,
                (registeredUri) => {
                    const transformed = applyCaseChange(registeredUri);
                    fc.pre(transformed !== registeredUri);

                    const client = makeClient([registeredUri]);
                    expect(() => service.validateRedirectUri(client, transformed)).toThrow(OAuthException);
                },
            ),
            {numRuns: 200},
        );
    });

    it('trailing slash toggled URIs are always rejected', () => {
        fc.assert(
            fc.property(
                baseUriArb,
                (registeredUri) => {
                    const transformed = toggleTrailingSlash(registeredUri);
                    fc.pre(transformed !== registeredUri);

                    const client = makeClient([registeredUri]);
                    expect(() => service.validateRedirectUri(client, transformed)).toThrow(OAuthException);
                },
            ),
            {numRuns: 200},
        );
    });

    it('percent-encoding variation URIs are always rejected', () => {
        fc.assert(
            fc.property(
                baseUriArb,
                (registeredUri) => {
                    const transformed = addUnnecessaryPercentEncoding(registeredUri);
                    fc.pre(transformed !== registeredUri);

                    const client = makeClient([registeredUri]);
                    expect(() => service.validateRedirectUri(client, transformed)).toThrow(OAuthException);
                },
            ),
            {numRuns: 200},
        );
    });

    it('query parameter reordered URIs are always rejected', () => {
        fc.assert(
            fc.property(
                // Use URIs that have at least 2 query params so reordering is meaningful
                fc.webUrl().map(url => url + '?alpha=1&beta=2'),
                (registeredUri) => {
                    const transformed = reorderQueryParams(registeredUri);
                    fc.pre(transformed !== registeredUri);

                    const client = makeClient([registeredUri]);
                    expect(() => service.validateRedirectUri(client, transformed)).toThrow(OAuthException);
                },
            ),
            {numRuns: 200},
        );
    });
});

/**
 * Feature: redirect-uri-validation, Property 3: Auth code stores redirect_uri as a round-trip
 *
 * For any authorization code creation, the redirect_uri value stored in the AuthCode record
 * SHALL exactly equal the redirect_uri provided in the originating request, or SHALL be null
 * when the redirect_uri was omitted.
 *
 * We verify storage indirectly through the token exchange binding:
 * - When redirect_uri was provided at authorize, token exchange with the exact same value succeeds.
 * - When no redirect_uri is in the stored auth code (seeded directly), token exchange without
 *   redirect_uri succeeds.
 *
 * **Validates: Requirements 2.3, 3.1, 3.2**
 */
describe('Feature: redirect-uri-validation, Property 3: Auth code stores redirect_uri as a round-trip', () => {
    let app: SharedTestFixture;
    let tokenFixture: TokenFixture;
    let clientApi: ClientEntityClient;
    let testClientId: string;
    let userId: string;
    let tenantId: string;

    const REGISTERED_URI = 'https://prop-roundtrip-test.example.com/callback';
    const email = 'admin@auth.server.com';
    const password = 'admin9000';
    const verifier = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopq';
    const challenge = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopq';

    beforeAll(async () => {
        app = new SharedTestFixture();
        tokenFixture = new TokenFixture(app);
        const {accessToken} = await tokenFixture.fetchAccessTokenFlow(email, password, 'auth.server.com');

        clientApi = new ClientEntityClient(app, accessToken);
        const tenantClient = new TenantClient(app, accessToken);
        const tenant = await tenantClient.createTenant('prop-roundtrip', 'prop-roundtrip.example.com');
        tenantId = tenant.id;

        const created = await clientApi.createClient(tenant.id, 'Roundtrip Prop Client', {
            alias: generateAlias('Roundtrip Prop Client'),
            redirectUris: [REGISTERED_URI],
            allowedScopes: 'openid profile email',
            isPublic: true,
        });
        testClientId = created.client.clientId;

        // Pre-grant consent so /authorize issues codes directly.
        await tokenFixture.preGrantConsentFlow(email, password, {
            clientId: testClientId,
            redirectUri: REGISTERED_URI,
            scope: 'openid profile email',
            state: 'consent-state',
            codeChallenge: challenge,
            codeChallengeMethod: 'plain',
        });

        // Resolve user id for direct auth-code seeding (null-redirect-uri case).
        const userRes = await app.getHttpServer().get(`/api/test-utils/users/by-email/${encodeURIComponent(email)}`);
        expect(userRes.status).toBe(200);
        userId = userRes.body.id;
    });

    afterAll(async () => {
        await clientApi.deleteClient(testClientId).catch(() => {
        });
        await app.close();
    });

    /** Login → authorize with REGISTERED_URI and return the resulting auth code. */
    async function loginForCodeWithRegisteredUri(): Promise<string> {
        return tokenFixture.fetchAuthCode(email, password, testClientId, REGISTERED_URI, {
            codeChallenge: challenge,
            codeChallengeMethod: 'plain',
        });
    }

    /** Seed an auth code directly with null redirect_uri (cannot go through /authorize for a null URI). */
    async function seedCodeWithoutRedirectUri(): Promise<string> {
        const res = await app.getHttpServer()
            .post('/api/test-utils/auth-codes')
            .send({
                userId,
                tenantId,
                clientId: testClientId,
                codeChallenge: challenge,
                method: 'plain',
                redirectUri: null,
                scope: 'openid profile email',
            })
            .set('Accept', 'application/json');
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
        return res.body.code;
    }

    /** Exchange an auth code for tokens, optionally with a redirect_uri */
    async function exchangeCode(code: string, redirectUri?: string): Promise<{ status: number; body: any }> {
        const payload: any = {
            grant_type: 'authorization_code',
            code,
            code_verifier: verifier,
            client_id: testClientId,
        };
        if (redirectUri !== undefined) {
            payload.redirect_uri = redirectUri;
        }

        const res = await app.getHttpServer()
            .post('/api/oauth/token')
            .send(payload)
            .set('Accept', 'application/json');

        return {status: res.status, body: res.body};
    }

    it('stored redirect_uri exactly equals the provided value (round-trip via token exchange)', async () => {
        // Property: for every auth code created with REGISTERED_URI, exchange with the same URI succeeds.
        // The shrinker filters out trivially invalid URIs by filtering on REGISTERED_URI equality.
        await fc.assert(
            fc.asyncProperty(
                fc.webUrl().filter(url => url !== REGISTERED_URI),
                async (_mismatchUri) => {
                    // Create auth code with the registered redirect_uri
                    const code = await loginForCodeWithRegisteredUri();

                    // Exchange with the exact same URI → should succeed (proves exact storage)
                    const matchResult = await exchangeCode(code, REGISTERED_URI);
                    expect(matchResult.status).toBeGreaterThanOrEqual(200);
                    expect(matchResult.status).toBeLessThan(300);
                    expect(matchResult.body.access_token).toBeDefined();
                },
            ),
            {numRuns: 10},
        );
    }, 180_000);

    it('stored redirect_uri is null when omitted from the originating request', async () => {
        const code = await seedCodeWithoutRedirectUri();

        // Exchange without redirect_uri → should succeed (null stored, binding bypassed)
        const result = await exchangeCode(code, undefined);
        expect(result.status).toBeGreaterThanOrEqual(200);
        expect(result.status).toBeLessThan(300);
        expect(result.body.access_token).toBeDefined();
    }, 30_000);

    it('redirect_uri round-trip: provided URI is stored exactly, omitted URI stores null', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.boolean(), // true = provide redirect_uri, false = omit
                async (provideUri) => {
                    if (provideUri) {
                        // Stored URI should be REGISTERED_URI — exchange with it succeeds
                        const code = await loginForCodeWithRegisteredUri();
                        const matchResult = await exchangeCode(code, REGISTERED_URI);
                        expect(matchResult.status).toBeGreaterThanOrEqual(200);
                        expect(matchResult.status).toBeLessThan(300);
                        expect(matchResult.body.access_token).toBeDefined();
                    } else {
                        // Stored URI should be null — exchange without redirect_uri succeeds
                        const code = await seedCodeWithoutRedirectUri();
                        const nullResult = await exchangeCode(code, undefined);
                        expect(nullResult.status).toBeGreaterThanOrEqual(200);
                        expect(nullResult.status).toBeLessThan(300);
                        expect(nullResult.body.access_token).toBeDefined();
                    }
                },
            ),
            {numRuns: 20},
        );
    }, 180_000);
});

/**
 * Feature: redirect-uri-validation, Properties 4 & 5: Token exchange redirect_uri binding
 */

/**
 * Feature: redirect-uri-validation, Property 4: Token exchange binding accepts iff request URI matches stored URI
 *
 * For any AuthCode record with a non-null redirect_uri, the token exchange SHALL succeed
 * if and only if the Token_Request includes a redirect_uri parameter whose value is
 * byte-for-byte equal to the stored value.
 *
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
 */
describe('Feature: redirect-uri-validation, Property 4: Token exchange binding accepts iff request URI matches stored URI', () => {
    let app: SharedTestFixture;
    let tokenFixture: TokenFixture;
    let clientApi: ClientEntityClient;
    let testClientId: string;

    const REGISTERED_URI = 'https://prop-binding-test.example.com/callback';
    const email = 'admin@auth.server.com';
    const password = 'admin9000';
    const verifier = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopq';

    beforeAll(async () => {
        app = new SharedTestFixture();
        tokenFixture = new TokenFixture(app);
        const {accessToken} = await tokenFixture.fetchAccessTokenFlow(email, password, 'auth.server.com');

        clientApi = new ClientEntityClient(app, accessToken);
        const tenantClient = new TenantClient(app, accessToken);
        const tenant = await tenantClient.createTenant('prop-binding', 'prop-binding.example.com');

        const created = await clientApi.createClient(tenant.id, 'Binding Prop Client', {
            alias: generateAlias('Binding Prop Client'),
            redirectUris: [REGISTERED_URI],
            allowedScopes: 'openid profile email',
            isPublic: true,
        });
        testClientId = created.client.clientId;

        // Pre-grant consent so /authorize issues codes directly (third-party client).
        await tokenFixture.preGrantConsentFlow(email, password, {
            clientId: testClientId,
            redirectUri: REGISTERED_URI,
            scope: 'openid profile email',
            state: 'consent-state',
            codeChallenge: verifier,
            codeChallengeMethod: 'plain',
        });
    });

    afterAll(async () => {
        await clientApi.deleteClient(testClientId).catch(() => {
        });
        await app.close();
    });

    /** Obtain a fresh auth code via login → authorize (cookie flow), bound to REGISTERED_URI. */
    async function loginForCode(): Promise<string> {
        return tokenFixture.fetchAuthCode(email, password, testClientId, REGISTERED_URI, {
            codeChallenge: verifier,
            codeChallengeMethod: 'plain',
        });
    }

    /** Exchange an auth code for tokens, optionally with a redirect_uri */
    async function exchangeCode(code: string, redirectUri?: string): Promise<{ status: number; body: any }> {
        const payload: any = {
            grant_type: 'authorization_code',
            code,
            code_verifier: verifier,
            client_id: testClientId,
        };
        if (redirectUri !== undefined) {
            payload.redirect_uri = redirectUri;
        }

        const res = await app.getHttpServer()
            .post('/api/oauth/token')
            .send(payload)
            .set('Accept', 'application/json');

        return {status: res.status, body: res.body};
    }

    /**
     * Property 4: Token exchange succeeds iff request URI exactly matches stored URI.
     *
     * When an auth code was created with a redirect_uri (non-null stored value),
     * token exchange with the exact same URI succeeds, while exchange with any
     * different URI (or omitted URI) is rejected with invalid_grant.
     */
    it('token exchange succeeds iff request redirect_uri exactly matches stored redirect_uri', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate an arbitrary URL that is guaranteed to differ from REGISTERED_URI
                fc.webUrl().filter(url => url !== REGISTERED_URI),
                async (mismatchUri) => {
                    // --- Exact match case: should succeed ---
                    const codeMatch = await loginForCode();
                    const matchResult = await exchangeCode(codeMatch, REGISTERED_URI);
                    expect(matchResult.status).toBeGreaterThanOrEqual(200);
                    expect(matchResult.status).toBeLessThan(300);
                    expect(matchResult.body.access_token).toBeDefined();

                    // --- Mismatch case: should fail with invalid_grant ---
                    const codeMismatch = await loginForCode();
                    const mismatchResult = await exchangeCode(codeMismatch, mismatchUri);
                    expect(mismatchResult.status).toBe(400);
                    expect(mismatchResult.body.error).toBe('invalid_grant');

                    // --- Omitted case: should fail with invalid_grant ---
                    const codeOmitted = await loginForCode();
                    const omittedResult = await exchangeCode(codeOmitted, undefined);
                    expect(omittedResult.status).toBe(400);
                    expect(omittedResult.body.error).toBe('invalid_grant');
                },
            ),
            {numRuns: 10},
        );
    }, 180_000);
});


/**
 * Feature: redirect-uri-validation, Property 5: Null stored redirect_uri bypasses binding check
 *
 * For any AuthCode record with a null redirect_uri, the token exchange SHALL accept
 * the request regardless of whether a redirect_uri parameter is present or absent
 * in the Token_Request.
 *
 * **Validates: Requirements 4.5**
 *
 * Note: The HTTP /authorize flow always validates and stores a redirect_uri against the
 * client's registered URIs (rejecting clients that have none). To create an AuthCode with
 * a null redirect_uri we seed one directly via the test-utils controller. This still
 * exercises the token-endpoint binding code-path, which is what Property 5 is about.
 */
describe('Feature: redirect-uri-validation, Property 5: Null stored redirect_uri bypasses binding check', () => {
    let app: SharedTestFixture;
    let tokenFixture: TokenFixture;
    let clientApi: ClientEntityClient;
    let testClientId: string;
    let userId: string;
    let tenantId: string;

    const REGISTERED_URI = 'https://prop-null-binding-test.example.com/callback';
    const email = 'admin@auth.server.com';
    const password = 'admin9000';
    const verifier = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopq';
    const challenge = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopq';

    beforeAll(async () => {
        app = new SharedTestFixture();
        tokenFixture = new TokenFixture(app);
        const {accessToken} = await tokenFixture.fetchAccessTokenFlow(email, password, 'auth.server.com');

        clientApi = new ClientEntityClient(app, accessToken);
        const tenantClient = new TenantClient(app, accessToken);
        const tenant = await tenantClient.createTenant('prop-null-bind', 'prop-null-bind.example.com');
        tenantId = tenant.id;

        const created = await clientApi.createClient(tenant.id, 'Null Binding Prop Client', {
            alias: generateAlias('Null Binding Prop Client'),
            redirectUris: [REGISTERED_URI],
            allowedScopes: 'openid profile email',
            isPublic: true,
        });
        testClientId = created.client.clientId;

        // Look up the admin user's id so we can seed auth codes with a valid FK.
        const userRes = await app.getHttpServer().get(`/api/test-utils/users/by-email/${encodeURIComponent(email)}`);
        expect(userRes.status).toBe(200);
        userId = userRes.body.id;
    });

    afterAll(async () => {
        await clientApi.deleteClient(testClientId).catch(() => {
        });
        await app.close();
    });

    /** Seed an auth code with null redirect_uri via the test-utils controller. */
    async function seedCodeWithoutRedirectUri(): Promise<string> {
        const res = await app.getHttpServer()
            .post('/api/test-utils/auth-codes')
            .send({
                userId,
                tenantId,
                clientId: testClientId,
                codeChallenge: challenge,
                method: 'plain',
                redirectUri: null,
                scope: 'openid profile email',
            })
            .set('Accept', 'application/json');
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(300);
        return res.body.code;
    }

    /** Exchange an auth code for tokens, optionally with a redirect_uri */
    async function exchangeCode(code: string, redirectUri?: string): Promise<{ status: number; body: any }> {
        const payload: any = {
            grant_type: 'authorization_code',
            code,
            code_verifier: verifier,
            client_id: testClientId,
        };
        if (redirectUri !== undefined) {
            payload.redirect_uri = redirectUri;
        }

        const res = await app.getHttpServer()
            .post('/api/oauth/token')
            .send(payload)
            .set('Accept', 'application/json');

        return {status: res.status, body: res.body};
    }

    /**
     * Property 5: When auth code has null redirect_uri, token exchange always succeeds
     * regardless of the redirect_uri value in the request.
     */
    it('token exchange succeeds with any redirect_uri when stored redirect_uri is null', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate either an arbitrary URL string or undefined
                fc.option(fc.webUrl(), {nil: undefined}),
                async (requestRedirectUri) => {
                    const code = await seedCodeWithoutRedirectUri();
                    const result = await exchangeCode(code, requestRedirectUri ?? undefined);

                    expect(result.status).toBeGreaterThanOrEqual(200);
                    expect(result.status).toBeLessThan(300);
                    expect(result.body.access_token).toBeDefined();
                },
            ),
            {numRuns: 20},
        );
    }, 180_000);
});

/**
 * Feature: redirect-uri-validation, Property 6: Error responses never leak the submitted redirect_uri
 *
 * For any redirect URI validation failure, the error response body (JSON `error` and
 * `error_description` fields) SHALL NOT contain the submitted `redirect_uri` value as a substring.
 *
 * **Validates: Requirements 5.3**
 *
 * Notes on the cookie-based flow (post-refactor):
 *   - /login no longer accepts a redirect_uri (validated by LoginSchema). It can't leak a URI
 *     it never received, so the former "login endpoint" property is covered at /authorize
 *     which is where redirect_uri is actually validated.
 *   - /token receives redirect_uri via CodeGrantSchema; errors are JSON and must not echo the value.
 */
describe('Feature: redirect-uri-validation, Property 6: Error responses never leak the submitted redirect_uri', () => {
    let app: SharedTestFixture;
    let tokenFixture: TokenFixture;
    let clientApi: ClientEntityClient;
    let testClientId: string;

    const REGISTERED_URI = 'https://prop-no-leak-test.example.com/callback';
    const email = 'admin@auth.server.com';
    const password = 'admin9000';
    const verifier = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopq';

    beforeAll(async () => {
        app = new SharedTestFixture();
        tokenFixture = new TokenFixture(app);
        const {accessToken} = await tokenFixture.fetchAccessTokenFlow(email, password, 'auth.server.com');

        clientApi = new ClientEntityClient(app, accessToken);
        const tenantClient = new TenantClient(app, accessToken);
        const adminTenantClient = new AdminTenantClient(app, accessToken);
        const tenant = await tenantClient.createTenant('prop-no-leak', 'prop-no-leak.example.com');

        await adminTenantClient.addMembers(tenant.id, [email]);

        const created = await clientApi.createClient(tenant.id, 'No Leak Prop Client', {
            alias: generateAlias('No Leak Prop Client'),
            redirectUris: [REGISTERED_URI],
            allowedScopes: 'openid profile email',
            isPublic: true,
        });
        testClientId = created.client.clientId;

        // Pre-grant consent so /authorize issues codes directly (needed for the /token test).
        await tokenFixture.preGrantConsentFlow(email, password, {
            clientId: testClientId,
            redirectUri: REGISTERED_URI,
            scope: 'openid profile email',
            state: 'consent-state',
            codeChallenge: verifier,
            codeChallengeMethod: 'plain',
        });
    });

    afterAll(async () => {
        await clientApi.deleteClient(testClientId).catch(() => {
        });
        await app.close();
    });

    /**
     * Property 6a: Authorization endpoint error responses never leak the submitted redirect_uri.
     *
     * Generate arbitrary non-matching redirect_uri strings, send them to GET /api/oauth/authorize,
     * and assert the submitted URI does not appear anywhere in the JSON response body.
     */
    it('authorization endpoint error responses never contain the submitted redirect_uri', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.webUrl().filter(url => url !== REGISTERED_URI),
                async (badUri) => {
                    const query = new URLSearchParams({
                        response_type: 'code',
                        client_id: testClientId,
                        redirect_uri: badUri,
                        state: 'no-leak-auth-test',
                    }).toString();

                    const res = await app.getHttpServer()
                        .get(`/api/oauth/authorize?${query}`)
                        .redirects(0);

                    expect(res.status).toBe(400);

                    const bodyStr = JSON.stringify(res.body);
                    expect(bodyStr).not.toContain(badUri);

                    if (res.body.error) {
                        expect(res.body.error).not.toContain(badUri);
                    }
                    if (res.body.error_description) {
                        expect(res.body.error_description).not.toContain(badUri);
                    }
                },
            ),
            {numRuns: 20},
        );
    }, 120_000);

    /**
     * Property 6b: Token exchange endpoint error responses never leak the submitted redirect_uri.
     *
     * Create an auth code with the registered URI via the cookie-based login→authorize flow,
     * then attempt token exchange with arbitrary non-matching redirect_uri strings. Assert the
     * submitted URI does not appear in the response.
     */
    it('token exchange endpoint error responses never contain the submitted redirect_uri', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.webUrl().filter(url => url !== REGISTERED_URI),
                async (badUri) => {
                    // Obtain an auth code via login → authorize (cookie flow).
                    const code = await tokenFixture.fetchAuthCode(
                        email, password, testClientId, REGISTERED_URI,
                    );

                    // Attempt token exchange with a mismatched redirect_uri
                    const res = await app.getHttpServer()
                        .post('/api/oauth/token')
                        .send({
                            grant_type: 'authorization_code',
                            code,
                            code_verifier: verifier,
                            client_id: testClientId,
                            redirect_uri: badUri,
                        })
                        .set('Accept', 'application/json');

                    expect(res.status).toBe(400);

                    const bodyStr = JSON.stringify(res.body);
                    expect(bodyStr).not.toContain(badUri);

                    if (res.body.error) {
                        expect(res.body.error).not.toContain(badUri);
                    }
                    if (res.body.error_description) {
                        expect(res.body.error_description).not.toContain(badUri);
                    }
                },
            ),
            {numRuns: 20},
        );
    }, 120_000);
});

const CODE_CHALLENGE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopq';
const ADMIN_EMAIL = 'admin@auth.server.com';
const ADMIN_PASSWORD = 'admin9000';
const REDIRECT_URI = 'https://ruc-test.local/callback';

describe('Feature: redirect-url-construction, Property 4: Redirect URL correctly includes authorization code and state', () => {
    let app: SharedTestFixture;
    let tokenFixture: TokenFixture;
    let tenantApi: TenantClient;
    let clientApi: ClientEntityClient;
    let superAccessToken: string;
    let testClientId: string;
    let tenantId: string;

    beforeAll(async () => {
        app = new SharedTestFixture();
        tokenFixture = new TokenFixture(app);

        const adminToken = await tokenFixture.fetchAccessTokenFlow(
            ADMIN_EMAIL, ADMIN_PASSWORD, 'auth.server.com',
        );
        superAccessToken = adminToken.accessToken;
        tenantApi = new TenantClient(app, superAccessToken);
        clientApi = new ClientEntityClient(app, superAccessToken);

        const uniqueSuffix = String(Date.now()).slice(-6);
        const domain = `ruc-${uniqueSuffix}.local`;
        const tenant = await tenantApi.createTenant(`RUC${uniqueSuffix}`, domain);
        tenantId = tenant.id;
        testClientId = domain;

        const defaultClient = await findClientByAlias(app, superAccessToken, domain);
        if (defaultClient) {
            await clientApi.updateClient(defaultClient.clientId, {redirectUris: [REDIRECT_URI]});
        }
    });

    afterAll(async () => {
        await app.close();
    });

    it('successful authorize always redirects with code and state in the URL', async () => {
        // Pre-grant consent for the widest scope so all sub-scopes are covered
        await tokenFixture.preGrantConsentFlow(ADMIN_EMAIL, ADMIN_PASSWORD, {
            clientId: testClientId,
            redirectUri: REDIRECT_URI,
            scope: 'openid profile email',
            state: 'consent-setup',
            codeChallenge: CODE_CHALLENGE,
            codeChallengeMethod: 'plain',
        });

        const stateArb = fc.string({minLength: 1, maxLength: 30}).filter(s => !s.includes(' ') && !s.includes('+'));
        const scopeArb = fc.constantFrom('openid', 'openid profile', 'openid email');

        await fc.assert(
            fc.asyncProperty(stateArb, scopeArb, async (state, scope) => {
                const sidCookie = await tokenFixture.fetchSidCookieFlow(ADMIN_EMAIL, ADMIN_PASSWORD, {
                    clientId: testClientId,
                    redirectUri: REDIRECT_URI,
                    scope: 'openid profile email',
                    state: 'test-state',
                    codeChallenge: CODE_CHALLENGE,
                    codeChallengeMethod: 'plain',
                });

                const res = await app.getHttpServer()
                    .get('/api/oauth/authorize')
                    .query({
                        response_type: 'code',
                        client_id: testClientId,
                        redirect_uri: REDIRECT_URI,
                        scope,
                        state,
                        code_challenge: CODE_CHALLENGE,
                        code_challenge_method: 'plain',
                        session_confirmed: 'true',
                    })
                    .set('Cookie', sidCookie)
                    .redirects(0);

                expect(res.status).toBe(302);
                const location: string = res.headers['location'];
                expect(location).toBeDefined();
                expect(location).toContain('code=');

                const url = new URL(location, 'http://localhost');
                expect(url.searchParams.has('error')).toBe(false);
                expect(url.searchParams.get('state')).toBe(state);
                const code = url.searchParams.get('code');
                expect(code).toBeTruthy();
                expect(code!.length).toBeGreaterThan(0);
            }),
            {numRuns: 15},
        );
    });

    it('redirect URL does not leak sensitive parameters', async () => {
        // Consent already pre-granted in the first test for this client+user
        const sidCookie = await tokenFixture.fetchSidCookieFlow(ADMIN_EMAIL, ADMIN_PASSWORD, {
            clientId: testClientId,
            redirectUri: REDIRECT_URI,
            scope: 'openid profile email',
            state: 'test-state',
            codeChallenge: CODE_CHALLENGE,
            codeChallengeMethod: 'plain',
        });

        const res = await app.getHttpServer()
            .get('/api/oauth/authorize')
            .query({
                response_type: 'code',
                client_id: testClientId,
                redirect_uri: REDIRECT_URI,
                scope: 'openid',
                state: 'no-leak-test',
                code_challenge: CODE_CHALLENGE,
                code_challenge_method: 'plain',
                session_confirmed: 'true',
            })
            .set('Cookie', sidCookie)
            .redirects(0);

        expect(res.status).toBe(302);
        const location: string = res.headers['location'];
        const url = new URL(location, 'http://localhost');

        expect(url.searchParams.has('code')).toBe(true);
        expect(url.searchParams.has('state')).toBe(true);
        expect(url.searchParams.has('code_challenge')).toBe(false);
        expect(url.searchParams.has('session_confirmed')).toBe(false);
        expect(url.searchParams.has('client_secret')).toBe(false);
        expect(url.searchParams.has('password')).toBe(false);
    });
});

async function findClientByAlias(
    app: SharedTestFixture,
    accessToken: string,
    alias: string,
): Promise<any | null> {
    const response = await app.getHttpServer()
        .post('/api/search/Clients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
            pageNo: 0,
            pageSize: 10,
            where: [{field: 'alias', label: 'alias', value: alias, operator: 'equals'}],
        });
    if (response.status >= 200 && response.status < 300) {
        const rows = response.body?.data ?? [];
        return rows.find((c: any) => c.alias === alias) ?? null;
    }
    return null;
}
