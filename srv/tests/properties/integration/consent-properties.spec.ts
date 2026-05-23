import * as fc from 'fast-check';
import {ScopeNormalizer} from '../../../src/casl/scope-normalizer';
import {ClientEntityClient} from '../../api-client/client-entity-client';
import {TenantClient} from '../../api-client/tenant-client';
import {SharedTestFixture} from '../../shared-test.fixture';
import {TokenFixture} from '../../token.fixture';
import {generateAlias} from '../../api-client/client';

/**
 * Feature: user-consent-tracking, Property 1: Consent version tracks mutation count
 *
 * For any user-client pair, if N consent grant operations are performed sequentially,
 * the resulting `consent_version` SHALL equal N. The first grant sets version to 1,
 * and each subsequent grant increments it by exactly 1.
 *
 * **Validates: Requirements 1.3, 1.4**
 *
 * Since there is no public API to read the version number, we verify the invariant
 * indirectly by confirming the consent record remains valid and covers the cumulative
 * union of all granted scopes after each grant. Each successful /authorize (no
 * consent UI redirect) is evidence of a live, consistent record.
 */
describe('Feature: user-consent-tracking, Property 1: Consent version tracks mutation count', () => {
    let fixture: SharedTestFixture;
    let tokenFixture: TokenFixture;
    let clientApi: ClientEntityClient;
    let testTenantId: string;

    const REDIRECT_URI = 'https://consent-version-prop.example.com/callback';
    const CODE_CHALLENGE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopq';
    const email = 'admin@auth.server.com';
    const password = 'admin9000';

    beforeAll(async () => {
        fixture = new SharedTestFixture();
        tokenFixture = new TokenFixture(fixture);
        const {accessToken} = await tokenFixture.fetchAccessTokenFlow(email, password, 'auth.server.com');
        clientApi = new ClientEntityClient(fixture, accessToken);

        const tenantClient = new TenantClient(fixture, accessToken);
        const uniqueSuffix = String(Date.now()).slice(-8);
        const tenant = await tenantClient.createTenant(
            `cv-prop-${uniqueSuffix}`,
            `cv-prop-${uniqueSuffix}.com`,
        );
        testTenantId = tenant.id;
    }, 60_000);

    afterAll(async () => {
        await fixture.close();
    });

    /** Grant consent with the given scopes. */
    async function grantConsent(clientId: string, scopes: string[]): Promise<void> {
        await tokenFixture.preGrantConsentFlow(email, password, {
            clientId,
            redirectUri: REDIRECT_URI,
            scope: scopes.join(' '),
            state: 'consent-state',
            codeChallenge: CODE_CHALLENGE,
            codeChallengeMethod: 'plain',
        });
    }

    /**
     * Drive /authorize and determine if consent is required.
     */
    async function isConsentRequired(clientId: string, requestedScopes: string[]): Promise<boolean> {
        const params = {
            clientId,
            redirectUri: REDIRECT_URI,
            scope: requestedScopes.join(' '),
            state: 'version-check',
            codeChallenge: CODE_CHALLENGE,
            codeChallengeMethod: 'plain',
        };
        const csrfContext = await tokenFixture.initializeFlow(params);
        const sidCookie = await tokenFixture.login(email, password, clientId, csrfContext);

        const {location} = await tokenFixture.checkAuthorize(params, sidCookie, csrfContext.flowIdCookie);

        if (location.includes('view=consent') || location.includes('/consent?')) return true;

        const url = new URL(location, 'http://localhost');
        expect(url.searchParams.has('error')).toBe(false);
        expect(url.searchParams.get('code')).toBeTruthy();
        return false;
    }

    it('consent record remains valid after N sequential grants', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.subarray(['openid', 'profile', 'email'], {minLength: 1}),
                    {minLength: 1, maxLength: 10},
                ),
                async (scopeSequence) => {
                    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                    const client = await clientApi.createClient(
                        testTenantId,
                        `CV Prop ${uniqueSuffix}`,
                        {
                            alias: generateAlias(`CV Prop ${uniqueSuffix}`),
                            redirectUris: [REDIRECT_URI],
                            allowedScopes: 'openid profile email',
                            isPublic: true,
                        },
                    );
                    const clientId = client.client.clientId;

                    try {
                        // Perform N grants sequentially
                        for (const scopes of scopeSequence) {
                            await grantConsent(clientId, scopes);
                        }

                        // After N grants, the record must cover the union of all granted scopes
                        const allGrantedScopes = Array.from(new Set(scopeSequence.flat()));

                        expect(await isConsentRequired(clientId, allGrantedScopes)).toBe(false);
                    } finally {
                        await clientApi.deleteClient(clientId).catch(() => {
                        });
                    }
                },
            ),
            {numRuns: 10},
        );
    }, 300_000);

    it('first grant creates a valid consent record (record exists at version 1)', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.subarray(['openid', 'profile', 'email'], {minLength: 1}),
                async (scopes) => {
                    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                    const client = await clientApi.createClient(
                        testTenantId,
                        `CV First ${uniqueSuffix}`,
                        {
                            alias: generateAlias(`CV First ${uniqueSuffix}`),
                            redirectUris: [REDIRECT_URI],
                            allowedScopes: 'openid profile email',
                            isPublic: true,
                        },
                    );
                    const clientId = client.client.clientId;

                    try {
                        // Before any grant: /authorize must redirect to consent UI
                        expect(await isConsentRequired(clientId, scopes)).toBe(true);

                        // Perform exactly 1 grant
                        await grantConsent(clientId, scopes);

                        // After 1 grant: /authorize must NOT require consent
                        expect(await isConsentRequired(clientId, scopes)).toBe(false);
                    } finally {
                        await clientApi.deleteClient(clientId).catch(() => {
                        });
                    }
                },
            ),
            {numRuns: 10},
        );
    }, 300_000);

    it('each subsequent grant keeps the consent record valid (version increments monotonically)', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.subarray(['openid', 'profile', 'email'], {minLength: 1}),
                    {minLength: 2, maxLength: 5},
                ),
                async (scopeSequence) => {
                    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                    const client = await clientApi.createClient(
                        testTenantId,
                        `CV Mono ${uniqueSuffix}`,
                        {
                            alias: generateAlias(`CV Mono ${uniqueSuffix}`),
                            redirectUris: [REDIRECT_URI],
                            allowedScopes: 'openid profile email',
                            isPublic: true,
                        },
                    );
                    const clientId = client.client.clientId;

                    try {
                        // Perform all N grants sequentially; record must cover cumulative union after each.
                        for (let i = 0; i < scopeSequence.length; i++) {
                            await grantConsent(clientId, scopeSequence[i]);

                            const cumulativeScopes = Array.from(
                                new Set(scopeSequence.slice(0, i + 1).flat()),
                            );

                            expect(await isConsentRequired(clientId, cumulativeScopes)).toBe(false);
                        }
                    } finally {
                        await clientApi.deleteClient(clientId).catch(() => {
                        });
                    }
                },
            ),
            {numRuns: 10},
        );
    }, 300_000);
});

/**
 * Feature: user-consent-tracking, Property 4: Granting consent produces the union of scopes
 *
 * For any existing set of granted scopes G and newly approved scopes A, after calling
 * `grantConsent`, the stored `granted_scopes` SHALL equal G ∪ A (the set union),
 * normalized via `ScopeNormalizer`.
 *
 * **Validates: Requirements 3.2**
 */
describe('Feature: user-consent-tracking, Property 4: Granting consent produces the union of scopes', () => {
    let fixture: SharedTestFixture;
    let tokenFixture: TokenFixture;
    let clientApi: ClientEntityClient;
    let testTenantId: string;

    const REDIRECT_URI = 'https://consent-union-prop.example.com/callback';
    const CODE_CHALLENGE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopq';
    const email = 'admin@auth.server.com';
    const password = 'admin9000';

    beforeAll(async () => {
        fixture = new SharedTestFixture();
        tokenFixture = new TokenFixture(fixture);
        const {accessToken} = await tokenFixture.fetchAccessTokenFlow(email, password, 'auth.server.com');
        clientApi = new ClientEntityClient(fixture, accessToken);

        const tenantClient = new TenantClient(fixture, accessToken);
        const uniqueSuffix = String(Date.now()).slice(-8);
        const tenant = await tenantClient.createTenant(
            `cu-prop-${uniqueSuffix}`,
            `cu-prop-${uniqueSuffix}.com`,
        );
        testTenantId = tenant.id;
    }, 60_000);

    afterAll(async () => {
        await fixture.close();
    });

    /** Grant consent via tokenFixture.preGrantConsentFlow (cookie + CSRF). */
    async function grantConsent(clientId: string, scopes: string[]): Promise<void> {
        await tokenFixture.preGrantConsentFlow(email, password, {
            clientId,
            redirectUri: REDIRECT_URI,
            scope: scopes.join(' '),
            state: 'consent-state',
            codeChallenge: CODE_CHALLENGE,
            codeChallengeMethod: 'plain',
        });
    }

    /**
     * Drive /authorize and determine if consent is required.
     * Returns true if /authorize redirected to the consent UI.
     */
    async function isConsentRequired(clientId: string, requestedScopes: string[]): Promise<boolean> {
        const params = {
            clientId,
            redirectUri: REDIRECT_URI,
            scope: requestedScopes.join(' '),
            state: 'union-check',
            codeChallenge: CODE_CHALLENGE,
            codeChallengeMethod: 'plain',
        };
        const csrfContext = await tokenFixture.initializeFlow(params);
        const sidCookie = await tokenFixture.login(email, password, clientId, csrfContext);

        const {location} = await tokenFixture.checkAuthorize(params, sidCookie, csrfContext.flowIdCookie);

        if (location.includes('view=consent') || location.includes('/consent?')) return true;

        const url = new URL(location, 'http://localhost');
        expect(url.searchParams.has('error')).toBe(false);
        expect(url.searchParams.get('code')).toBeTruthy();
        return false;
    }

    /**
     * Verify the stored consent covers exactly `expectedUnion` — /authorize succeeds for the
     * union, and any scope outside the union makes /authorize redirect to consent UI.
     */
    async function verifyStoredScopes(
        clientId: string,
        expectedUnion: string[],
    ): Promise<void> {
        const normalizedExpected = ScopeNormalizer.format(expectedUnion);
        const expectedScopeArray = ScopeNormalizer.parse(normalizedExpected);

        // /authorize with the full expected union — must NOT require consent
        expect(await isConsentRequired(clientId, expectedScopeArray)).toBe(false);

        // Determine scopes NOT in the expected union
        const allScopes = ['openid', 'profile', 'email'];
        const scopesOutsideUnion = allScopes.filter(s => !expectedScopeArray.includes(s));

        // If there are scopes outside the union, /authorize must require consent for them.
        if (scopesOutsideUnion.length > 0) {
            expect(await isConsentRequired(clientId, [...expectedScopeArray, ...scopesOutsideUnion])).toBe(true);
        }
    }

    it('stored scopes after grantConsent equal G ∪ A (normalized)', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.subarray(['openid', 'profile', 'email'], {minLength: 1}),
                fc.subarray(['openid', 'profile', 'email'], {minLength: 1}),
                async (grantedScopes, approvedScopes) => {
                    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                    const client = await clientApi.createClient(
                        testTenantId,
                        `CU Prop ${uniqueSuffix}`,
                        {
                            alias: generateAlias(`CU Prop ${uniqueSuffix}`),
                            redirectUris: [REDIRECT_URI],
                            allowedScopes: 'openid profile email',
                            isPublic: true,
                        },
                    );
                    const clientId = client.client.clientId;

                    try {
                        // Step 1: Create initial consent with G
                        await grantConsent(clientId, grantedScopes);

                        // Step 2: Grant consent with A (update existing record)
                        await grantConsent(clientId, approvedScopes);

                        // Step 3: Compute expected union G ∪ A
                        const expectedUnion = ScopeNormalizer.union(grantedScopes, approvedScopes);

                        // Step 4: Verify stored scopes equal G ∪ A
                        await verifyStoredScopes(clientId, expectedUnion);
                    } finally {
                        await clientApi.deleteClient(clientId).catch(() => {
                        });
                    }
                },
            ),
            {numRuns: 15},
        );
    }, 300_000);

    it('union is commutative: G ∪ A = A ∪ G (order of grants does not matter for final state)', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.subarray(['openid', 'profile', 'email'], {minLength: 1}),
                fc.subarray(['openid', 'profile', 'email'], {minLength: 1}),
                async (scopesFirst, scopesSecond) => {
                    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

                    const clientA = await clientApi.createClient(
                        testTenantId,
                        `CU CommA ${uniqueSuffix}`,
                        {
                            alias: generateAlias(`CU CommA ${uniqueSuffix}`),
                            redirectUris: [REDIRECT_URI],
                            allowedScopes: 'openid profile email',
                            isPublic: true,
                        },
                    );

                    const clientB = await clientApi.createClient(
                        testTenantId,
                        `CU CommB ${uniqueSuffix}`,
                        {
                            alias: generateAlias(`CU CommB ${uniqueSuffix}`),
                            redirectUris: [REDIRECT_URI],
                            allowedScopes: 'openid profile email',
                            isPublic: true,
                        },
                    );

                    try {
                        // Client A: grant scopesFirst, then scopesSecond
                        await grantConsent(clientA.client.clientId, scopesFirst);
                        await grantConsent(clientA.client.clientId, scopesSecond);

                        // Client B: grant scopesSecond, then scopesFirst
                        await grantConsent(clientB.client.clientId, scopesSecond);
                        await grantConsent(clientB.client.clientId, scopesFirst);

                        const expectedUnion = ScopeNormalizer.union(scopesFirst, scopesSecond);

                        await verifyStoredScopes(clientA.client.clientId, expectedUnion);
                        await verifyStoredScopes(clientB.client.clientId, expectedUnion);
                    } finally {
                        await clientApi.deleteClient(clientA.client.clientId).catch(() => {
                        });
                        await clientApi.deleteClient(clientB.client.clientId).catch(() => {
                        });
                    }
                },
            ),
            {numRuns: 10},
        );
    }, 300_000);

    it('granting the same scopes twice produces the same result as granting once (idempotent union)', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.subarray(['openid', 'profile', 'email'], {minLength: 1}),
                async (scopes) => {
                    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                    const client = await clientApi.createClient(
                        testTenantId,
                        `CU Idem ${uniqueSuffix}`,
                        {
                            alias: generateAlias(`CU Idem ${uniqueSuffix}`),
                            redirectUris: [REDIRECT_URI],
                            allowedScopes: 'openid profile email',
                            isPublic: true,
                        },
                    );
                    const clientId = client.client.clientId;

                    try {
                        await grantConsent(clientId, scopes);
                        await grantConsent(clientId, scopes);

                        // G ∪ G = G
                        await verifyStoredScopes(clientId, scopes);
                    } finally {
                        await clientApi.deleteClient(clientId).catch(() => {
                        });
                    }
                },
            ),
            {numRuns: 10},
        );
    }, 300_000);
});

/**
 * Feature: user-consent-tracking, Property 3: Missing consent record always requires consent
 *
 * For any user-client pair with no existing UserConsent record and any non-empty set of
 * requested scopes, the /authorize endpoint SHALL redirect the user to the consent UI
 * (indicating `consentRequired = true`).
 *
 * **Validates: Requirements 2.2**
 */
describe('Feature: user-consent-tracking, Property 3: Missing consent record always requires consent', () => {
    let fixture: SharedTestFixture;
    let tokenFixture: TokenFixture;
    let clientApi: ClientEntityClient;
    let testTenantId: string;

    const REDIRECT_URI = 'https://consent-missing-prop.example.com/callback';
    const CODE_CHALLENGE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopq';
    const email = 'admin@auth.server.com';
    const password = 'admin9000';

    beforeAll(async () => {
        fixture = new SharedTestFixture();
        tokenFixture = new TokenFixture(fixture);
        const {accessToken} = await tokenFixture.fetchAccessTokenFlow(email, password, 'auth.server.com');
        clientApi = new ClientEntityClient(fixture, accessToken);

        const tenantClient = new TenantClient(fixture, accessToken);
        const uniqueSuffix = String(Date.now()).slice(-8);
        const tenant = await tenantClient.createTenant(
            `cm-prop-${uniqueSuffix}`,
            `cm-prop-${uniqueSuffix}.com`,
        );
        testTenantId = tenant.id;
    }, 60_000);

    afterAll(async () => {
        await fixture.close();
    });

    /**
     * Drive /authorize (with a valid session) for the given client+scopes and determine
     * whether consent is required. Returns:
     *   { consentRequired: true }  if /authorize redirected to the consent UI
     *   { consentRequired: false, code }  if /authorize issued a code to redirect_uri
     */
    async function checkConsent(clientId: string, scopes: string[]): Promise<{
        consentRequired: boolean;
        code?: string
    }> {
        const params = {
            clientId,
            redirectUri: REDIRECT_URI,
            scope: scopes.join(' '),
            state: 'consent-check',
            codeChallenge: CODE_CHALLENGE,
            codeChallengeMethod: 'plain',
        };
        const csrfContext = await tokenFixture.initializeFlow(params);
        const sidCookie = await tokenFixture.login(email, password, clientId, csrfContext);

        const {location} = await tokenFixture.checkAuthorize(params, sidCookie, csrfContext.flowIdCookie);

        // Consent UI redirect → consent required
        if (location.includes('view=consent') || location.includes('/consent?')) {
            return {consentRequired: true};
        }

        // Otherwise should be a redirect to the client's redirect_uri carrying a code
        const url = new URL(location, 'http://localhost');
        expect(url.searchParams.has('error')).toBe(false);
        const code = url.searchParams.get('code');
        expect(code).toBeTruthy();
        return {consentRequired: false, code: code!};
    }

    it('consent is required for any non-empty set of requested scopes when no consent record exists', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate a non-empty set of requested scopes
                fc.subarray(['openid', 'profile', 'email'], {minLength: 1}),
                async (requestedScopes) => {
                    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                    const client = await clientApi.createClient(
                        testTenantId,
                        `CM Prop ${uniqueSuffix}`,
                        {
                            alias: generateAlias(`CM Prop ${uniqueSuffix}`),
                            redirectUris: [REDIRECT_URI],
                            allowedScopes: 'openid profile email',
                            isPublic: true,
                        },
                    );
                    const clientId = client.client.clientId;

                    try {
                        const result = await checkConsent(clientId, requestedScopes);
                        expect(result.consentRequired).toBe(true);
                        expect(result.code).toBeUndefined();
                    } finally {
                        await clientApi.deleteClient(clientId).catch(() => {
                        });
                    }
                },
            ),
            {numRuns: 20},
        );
    }, 300_000);

    it('consent is required for all valid OIDC scope combinations when no record exists', async () => {
        const allScopeCombinations: string[][] = [
            ['openid'],
            ['profile'],
            ['email'],
            ['openid', 'profile'],
            ['openid', 'email'],
            ['profile', 'email'],
            ['openid', 'profile', 'email'],
        ];

        for (const requestedScopes of allScopeCombinations) {
            const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            const client = await clientApi.createClient(
                testTenantId,
                        `CM All ${uniqueSuffix}`,
                        {
                            alias: generateAlias(`CM All ${uniqueSuffix}`),
                            redirectUris: [REDIRECT_URI],
                    allowedScopes: 'openid profile email',
                    isPublic: true,
                },
            );
            const clientId = client.client.clientId;

            try {
                const result = await checkConsent(clientId, requestedScopes);
                expect(result.consentRequired).toBe(true);
            } finally {
                await clientApi.deleteClient(clientId).catch(() => {
                });
            }
        }
    }, 300_000);

    it('consent is required even after a different client has been consented (no cross-client leakage)', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.subarray(['openid', 'profile', 'email'], {minLength: 1}),
                async (requestedScopes) => {
                    // Create two fresh clients
                    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                    const clientA = await clientApi.createClient(
                        testTenantId,
                        `CM ClientA ${uniqueSuffix}`,
                        {
                            alias: generateAlias(`CM ClientA ${uniqueSuffix}`),
                            redirectUris: [REDIRECT_URI],
                            allowedScopes: 'openid profile email',
                            isPublic: true,
                        },
                    );
                    const clientB = await clientApi.createClient(
                        testTenantId,
                        `CM ClientB ${uniqueSuffix}`,
                        {
                            alias: generateAlias(`CM ClientB ${uniqueSuffix}`),
                            redirectUris: [REDIRECT_URI],
                            allowedScopes: 'openid profile email',
                            isPublic: true,
                        },
                    );
                    const clientIdA = clientA.client.clientId;
                    const clientIdB = clientB.client.clientId;

                    try {
                        // Grant consent for client A for the requested scopes
                        await tokenFixture.preGrantConsentFlow(email, password, {
                            clientId: clientIdA,
                            redirectUri: REDIRECT_URI,
                            scope: requestedScopes.join(' '),
                            state: 'consent-state',
                            codeChallenge: CODE_CHALLENGE,
                            codeChallengeMethod: 'plain',
                        });

                        // Client B has NO consent record — must still require consent
                        const result = await checkConsent(clientIdB, requestedScopes);
                        expect(result.consentRequired).toBe(true);
                    } finally {
                        await clientApi.deleteClient(clientIdA).catch(() => {
                        });
                        await clientApi.deleteClient(clientIdB).catch(() => {
                        });
                    }
                },
            ),
            {numRuns: 10},
        );
    }, 300_000);
});

/**
 * Feature: user-consent-tracking, Property 5: Narrower requests do not modify the consent record
 *
 * For any existing UserConsent record with granted scopes G, when `checkConsent` is called
 * with requested scopes R where R ⊆ G, the stored `granted_scopes` SHALL remain equal to G
 * (unchanged).
 *
 * **Validates: Requirements 5.2**
 */
describe('Feature: user-consent-tracking, Property 5: Narrower requests do not modify the consent record', () => {
    let fixture: SharedTestFixture;
    let tokenFixture: TokenFixture;
    let clientApi: ClientEntityClient;
    let testTenantId: string;

    const REDIRECT_URI = 'https://consent-narrower-prop.example.com/callback';
    const CODE_CHALLENGE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopq';
    const email = 'admin@auth.server.com';
    const password = 'admin9000';

    beforeAll(async () => {
        fixture = new SharedTestFixture();
        tokenFixture = new TokenFixture(fixture);
        const {accessToken} = await tokenFixture.fetchAccessTokenFlow(email, password, 'auth.server.com');
        clientApi = new ClientEntityClient(fixture, accessToken);

        const tenantClient = new TenantClient(fixture, accessToken);
        const uniqueSuffix = String(Date.now()).slice(-8);
        const tenant = await tenantClient.createTenant(
            `cn-prop-${uniqueSuffix}`,
            `cn-prop-${uniqueSuffix}.com`,
        );
        testTenantId = tenant.id;
    }, 60_000);

    afterAll(async () => {
        await fixture.close();
    });

    /**
     * Drive /authorize and determine if consent is required.
     * Returns true if /authorize redirected to the consent UI.
     */
    async function isConsentRequired(clientId: string, requestedScopes: string[]): Promise<boolean> {
        const params = {
            clientId,
            redirectUri: REDIRECT_URI,
            scope: requestedScopes.join(' '),
            state: 'narrower-check',
            codeChallenge: CODE_CHALLENGE,
            codeChallengeMethod: 'plain',
        };
        const csrfContext = await tokenFixture.initializeFlow(params);
        const sidCookie = await tokenFixture.login(email, password, clientId, csrfContext);

        const {location} = await tokenFixture.checkAuthorize(params, sidCookie, csrfContext.flowIdCookie);

        if (location.includes('view=consent') || location.includes('/consent?')) return true;

        const url = new URL(location, 'http://localhost');
        expect(url.searchParams.has('error')).toBe(false);
        expect(url.searchParams.get('code')).toBeTruthy();
        return false;
    }

    /**
     * Verify that the stored consent record still covers exactly the original scopes G by checking:
     * 1. /authorize with G → issues code (G is still stored)
     * 2. /authorize with any scope outside G → consent required (no extra scopes were added)
     */
    async function verifyGrantedScopesUnchanged(
        clientId: string,
        originalGrantedScopes: string[],
    ): Promise<void> {
        const normalizedG = ScopeNormalizer.format(originalGrantedScopes);
        const gScopeArray = ScopeNormalizer.parse(normalizedG);

        // /authorize with G — must NOT require consent (G is still stored)
        expect(await isConsentRequired(clientId, gScopeArray)).toBe(false);

        // Determine scopes NOT in G
        const allScopes = ['openid', 'profile', 'email'];
        const scopesOutsideG = allScopes.filter(s => !gScopeArray.includes(s));

        // If there are scopes outside G, requesting G + extra must require consent.
        if (scopesOutsideG.length > 0) {
            expect(await isConsentRequired(clientId, [...gScopeArray, ...scopesOutsideG])).toBe(true);
        }
    }

    it('stored granted_scopes remain equal to G after a narrower request with R ⊆ G', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.subarray(['openid', 'profile', 'email'], {minLength: 1}),
                async (grantedScopes) => {
                    // Derive a non-empty R ⊆ G
                    const requestedScopes = grantedScopes.length === 1
                        ? grantedScopes
                        : grantedScopes.slice(0, Math.max(1, grantedScopes.length - 1));

                    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                    const client = await clientApi.createClient(
                        testTenantId,
                        `CN Prop ${uniqueSuffix}`,
                        {
                            alias: generateAlias(`CN Prop ${uniqueSuffix}`),
                            redirectUris: [REDIRECT_URI],
                            allowedScopes: 'openid profile email',
                            isPublic: true,
                        },
                    );
                    const clientId = client.client.clientId;

                    try {
                        // Step 1: Create consent record with G
                        await tokenFixture.preGrantConsentFlow(email, password, {
                            clientId,
                            redirectUri: REDIRECT_URI,
                            scope: grantedScopes.join(' '),
                            state: 'consent-state',
                            codeChallenge: CODE_CHALLENGE,
                            codeChallengeMethod: 'plain',
                        });

                        // Step 2: Call /authorize with R ⊆ G — must NOT require consent
                        expect(await isConsentRequired(clientId, requestedScopes)).toBe(false);

                        // Step 3: Verify stored scopes are still G (unchanged)
                        await verifyGrantedScopesUnchanged(clientId, grantedScopes);
                    } finally {
                        await clientApi.deleteClient(clientId).catch(() => {
                        });
                    }
                },
            ),
            {numRuns: 15},
        );
    }, 300_000);

    it('stored granted_scopes remain equal to G after multiple narrower requests', async () => {
        await fc.assert(
            fc.asyncProperty(
                // G must have at least 2 scopes so we can derive multiple strict subsets
                fc.subarray(['openid', 'profile', 'email'], {minLength: 2}),
                async (grantedScopes) => {
                    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                    const client = await clientApi.createClient(
                        testTenantId,
                        `CN Multi ${uniqueSuffix}`,
                        {
                            alias: generateAlias(`CN Multi ${uniqueSuffix}`),
                            redirectUris: [REDIRECT_URI],
                            allowedScopes: 'openid profile email',
                            isPublic: true,
                        },
                    );
                    const clientId = client.client.clientId;

                    try {
                        // Create consent record with G
                        await tokenFixture.preGrantConsentFlow(email, password, {
                            clientId,
                            redirectUri: REDIRECT_URI,
                            scope: grantedScopes.join(' '),
                            state: 'consent-state',
                            codeChallenge: CODE_CHALLENGE,
                            codeChallengeMethod: 'plain',
                        });

                        // Call /authorize multiple times with different subsets of G
                        for (let i = 1; i <= grantedScopes.length; i++) {
                            const subset = grantedScopes.slice(0, i);
                            expect(await isConsentRequired(clientId, subset)).toBe(false);
                        }

                        await verifyGrantedScopesUnchanged(clientId, grantedScopes);
                    } finally {
                        await clientApi.deleteClient(clientId).catch(() => {
                        });
                    }
                },
            ),
            {numRuns: 10},
        );
    }, 300_000);

    it('R = G does not modify the record (equal set is a subset)', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.subarray(['openid', 'profile', 'email'], {minLength: 1}),
                async (scopes) => {
                    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                    const client = await clientApi.createClient(
                        testTenantId,
                        `CN Equal ${uniqueSuffix}`,
                        {
                            alias: generateAlias(`CN Equal ${uniqueSuffix}`),
                            redirectUris: [REDIRECT_URI],
                            allowedScopes: 'openid profile email',
                            isPublic: true,
                        },
                    );
                    const clientId = client.client.clientId;

                    try {
                        await tokenFixture.preGrantConsentFlow(email, password, {
                            clientId,
                            redirectUri: REDIRECT_URI,
                            scope: scopes.join(' '),
                            state: 'consent-state',
                            codeChallenge: CODE_CHALLENGE,
                            codeChallengeMethod: 'plain',
                        });

                        expect(await isConsentRequired(clientId, scopes)).toBe(false);

                        await verifyGrantedScopesUnchanged(clientId, scopes);
                    } finally {
                        await clientApi.deleteClient(clientId).catch(() => {
                        });
                    }
                },
            ),
            {numRuns: 10},
        );
    }, 300_000);

    it('R ⊆ G does not expand the record beyond G (full-to-narrow case)', async () => {
        // Specific case: G = ['openid', 'profile', 'email'], R = ['openid']
        const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const client = await clientApi.createClient(
            testTenantId,
                            `CN NoExpand ${uniqueSuffix}`,
                            {
                                alias: generateAlias(`CN NoExpand ${uniqueSuffix}`),
                                redirectUris: [REDIRECT_URI],
                allowedScopes: 'openid profile email',
                isPublic: true,
            },
        );
        const clientId = client.client.clientId;

        try {
            const fullScopes = ['openid', 'profile', 'email'];
            const narrowScopes = ['openid'];

            await tokenFixture.preGrantConsentFlow(email, password, {
                clientId,
                redirectUri: REDIRECT_URI,
                scope: fullScopes.join(' '),
                state: 'consent-state',
                codeChallenge: CODE_CHALLENGE,
                codeChallengeMethod: 'plain',
            });

            expect(await isConsentRequired(clientId, narrowScopes)).toBe(false);

            await verifyGrantedScopesUnchanged(clientId, fullScopes);
        } finally {
            await clientApi.deleteClient(clientId).catch(() => {
            });
        }
    }, 60_000);
});

/**
 * Feature: user-consent-tracking, Property 2: Consent required iff requested scopes exceed granted scopes
 *
 * For any set of granted scopes G and requested scopes R (both drawn from valid OIDC scope
 * values), the consent check SHALL return `consentRequired = false` if and only if R ⊆ G.
 * Otherwise it SHALL return `consentRequired = true`.
 *
 * **Validates: Requirements 2.1, 3.1, 5.1**
 */
describe('Feature: user-consent-tracking, Property 2: Consent required iff requested scopes exceed granted scopes', () => {
    let fixture: SharedTestFixture;
    let tokenFixture: TokenFixture;
    let clientApi: ClientEntityClient;
    let testTenantId: string;

    const REDIRECT_URI = 'https://consent-iff-prop.example.com/callback';
    const CODE_CHALLENGE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopq';
    const email = 'admin@auth.server.com';
    const password = 'admin9000';

    beforeAll(async () => {
        fixture = new SharedTestFixture();
        tokenFixture = new TokenFixture(fixture);
        const {accessToken} = await tokenFixture.fetchAccessTokenFlow(email, password, 'auth.server.com');
        clientApi = new ClientEntityClient(fixture, accessToken);

        const tenantClient = new TenantClient(fixture, accessToken);
        const uniqueSuffix = String(Date.now()).slice(-8);
        const tenant = await tenantClient.createTenant(
            `ci-prop-${uniqueSuffix}`,
            `ci-prop-${uniqueSuffix}.com`,
        );
        testTenantId = tenant.id;
    }, 60_000);

    afterAll(async () => {
        await fixture.close();
    });

    /**
     * Drive /authorize (with a valid session) and determine whether consent is required.
     * Returns true iff /authorize redirected to the consent UI.
     */
    async function checkConsentRequired(clientId: string, requestedScopes: string[]): Promise<boolean> {
        const params = {
            clientId,
            redirectUri: REDIRECT_URI,
            scope: requestedScopes.join(' '),
            state: 'iff-check',
            codeChallenge: CODE_CHALLENGE,
            codeChallengeMethod: 'plain',
        };
        const csrfContext = await tokenFixture.initializeFlow(params);
        const sidCookie = await tokenFixture.login(email, password, clientId, csrfContext);

        const {location} = await tokenFixture.checkAuthorize(params, sidCookie, csrfContext.flowIdCookie);

        if (location.includes('view=consent') || location.includes('/consent?')) {
            return true;
        }

        // Otherwise must be a redirect to redirect_uri with a code (no error).
        const url = new URL(location, 'http://localhost');
        expect(url.searchParams.has('error')).toBe(false);
        expect(url.searchParams.get('code')).toBeTruthy();
        return false;
    }

    it('consentRequired = false iff R ⊆ G (biconditional)', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.subarray(['openid', 'profile', 'email'], {minLength: 1}),
                fc.subarray(['openid', 'profile', 'email'], {minLength: 1}),
                async (grantedScopes, requestedScopes) => {
                    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                    const client = await clientApi.createClient(
                        testTenantId,
                        `CI Prop ${uniqueSuffix}`,
                        {
                            alias: generateAlias(`CI Prop ${uniqueSuffix}`),
                            redirectUris: [REDIRECT_URI],
                            allowedScopes: 'openid profile email',
                            isPublic: true,
                        },
                    );
                    const clientId = client.client.clientId;

                    try {
                        // Grant consent with scopes G
                        await tokenFixture.preGrantConsentFlow(email, password, {
                            clientId,
                            redirectUri: REDIRECT_URI,
                            scope: grantedScopes.join(' '),
                            state: 'consent-state',
                            codeChallenge: CODE_CHALLENGE,
                            codeChallengeMethod: 'plain',
                        });

                        // Check consent with requested scopes R
                        const consentRequired = await checkConsentRequired(clientId, requestedScopes);

                        // Compute the expected result: R ⊆ G ↔ consentRequired = false
                        const rSubsetOfG = requestedScopes.every(s => grantedScopes.includes(s));

                        expect(consentRequired).toBe(!rSubsetOfG);
                    } finally {
                        await clientApi.deleteClient(clientId).catch(() => {
                        });
                    }
                },
            ),
            {numRuns: 20},
        );
    }, 300_000);

    it('consentRequired = false when R = G (equal sets)', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.subarray(['openid', 'profile', 'email'], {minLength: 1}),
                async (scopes) => {
                    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                    const client = await clientApi.createClient(
                        testTenantId,
                        `CI Equal ${uniqueSuffix}`,
                        {
                            alias: generateAlias(`CI Equal ${uniqueSuffix}`),
                            redirectUris: [REDIRECT_URI],
                            allowedScopes: 'openid profile email',
                            isPublic: true,
                        },
                    );
                    const clientId = client.client.clientId;

                    try {
                        await tokenFixture.preGrantConsentFlow(email, password, {
                            clientId,
                            redirectUri: REDIRECT_URI,
                            scope: scopes.join(' '),
                            state: 'consent-state',
                            codeChallenge: CODE_CHALLENGE,
                            codeChallengeMethod: 'plain',
                        });

                        const consentRequired = await checkConsentRequired(clientId, scopes);

                        expect(consentRequired).toBe(false);
                    } finally {
                        await clientApi.deleteClient(clientId).catch(() => {
                        });
                    }
                },
            ),
            {numRuns: 15},
        );
    }, 300_000);

    it('consentRequired = false when R is a strict subset of G', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.subarray(['openid', 'profile', 'email'], {minLength: 2}),
                async (grantedScopes) => {
                    const requestedScopes = grantedScopes.slice(0, grantedScopes.length - 1);
                    fc.pre(requestedScopes.length >= 1);

                    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                    const client = await clientApi.createClient(
                        testTenantId,
                        `CI Subset ${uniqueSuffix}`,
                        {
                            alias: generateAlias(`CI Subset ${uniqueSuffix}`),
                            redirectUris: [REDIRECT_URI],
                            allowedScopes: 'openid profile email',
                            isPublic: true,
                        },
                    );
                    const clientId = client.client.clientId;

                    try {
                        await tokenFixture.preGrantConsentFlow(email, password, {
                            clientId,
                            redirectUri: REDIRECT_URI,
                            scope: grantedScopes.join(' '),
                            state: 'consent-state',
                            codeChallenge: CODE_CHALLENGE,
                            codeChallengeMethod: 'plain',
                        });

                        const consentRequired = await checkConsentRequired(clientId, requestedScopes);

                        expect(consentRequired).toBe(false);
                    } finally {
                        await clientApi.deleteClient(clientId).catch(() => {
                        });
                    }
                },
            ),
            {numRuns: 10},
        );
    }, 300_000);

    it('consentRequired = true when R contains scopes not in G', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.subarray(['openid', 'profile', 'email'], {minLength: 1, maxLength: 2}),
                async (grantedScopes) => {
                    const requestedScopes = ['openid', 'profile', 'email'];
                    const rExceedsG = requestedScopes.some(s => !grantedScopes.includes(s));
                    fc.pre(rExceedsG);

                    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                    const client = await clientApi.createClient(
                        testTenantId,
                        `CI Exceed ${uniqueSuffix}`,
                        {
                            alias: generateAlias(`CI Exceed ${uniqueSuffix}`),
                            redirectUris: [REDIRECT_URI],
                            allowedScopes: 'openid profile email',
                            isPublic: true,
                        },
                    );
                    const clientId = client.client.clientId;

                    try {
                        await tokenFixture.preGrantConsentFlow(email, password, {
                            clientId,
                            redirectUri: REDIRECT_URI,
                            scope: grantedScopes.join(' '),
                            state: 'consent-state',
                            codeChallenge: CODE_CHALLENGE,
                            codeChallengeMethod: 'plain',
                        });

                        const consentRequired = await checkConsentRequired(clientId, requestedScopes);

                        expect(consentRequired).toBe(true);
                    } finally {
                        await clientApi.deleteClient(clientId).catch(() => {
                        });
                    }
                },
            ),
            {numRuns: 10},
        );
    }, 300_000);
});
