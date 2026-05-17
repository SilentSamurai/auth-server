import * as fc from 'fast-check';
import {CryptUtil} from '../../../src/util/crypt.util';
import {ValidationSchema} from '../../../src/validation/validation.schema';
import {ClientEntityClient} from '../../api-client/client-entity-client';
import {SharedTestFixture} from '../../shared-test.fixture';
import {TokenFixture} from '../../token.fixture';
import {createHash, randomBytes} from 'crypto';

/**
 * Feature: pkce-compliance, Property 1: Code verifier format validation
 *
 * For any string, the CodeGrantSchema code_verifier validator accepts it
 * if and only if the string has length in [43, 128] AND every character
 * belongs to the unreserved set [A-Za-z0-9\-._~].
 * Strings violating either condition are rejected.
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4
 */
describe('Property 1: Code verifier format validation', () => {

    // Valid base fields that satisfy the rest of CodeGrantSchema
    const validBase = {
        grant_type: 'authorization_code',
        code: 'some-auth-code',
        client_id: 'some-client-id',
    };

    const UNRESERVED_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

    // Arbitrary: single valid unreserved character
    const unreservedCharArb = fc.constantFrom(...UNRESERVED_CHARS.split(''));

    // Arbitrary: valid code_verifier (length 43-128, unreserved charset)
    const validVerifierArb = fc.integer({min: 43, max: 128}).chain((len: number) =>
        fc.array(unreservedCharArb, {minLength: len, maxLength: len})
            .map((chars: string[]) => chars.join('')),
    );

    // Arbitrary: verifier too short (1-42 chars, valid charset)
    const tooShortVerifierArb = fc.integer({min: 1, max: 42}).chain((len: number) =>
        fc.array(unreservedCharArb, {minLength: len, maxLength: len})
            .map((chars: string[]) => chars.join('')),
    );

    // Arbitrary: verifier too long (129-200 chars, valid charset)
    const tooLongVerifierArb = fc.integer({min: 129, max: 200}).chain((len: number) =>
        fc.array(unreservedCharArb, {minLength: len, maxLength: len})
            .map((chars: string[]) => chars.join('')),
    );

    // Arbitrary: invalid character (outside unreserved set)
    const invalidCharArb = fc.oneof(
        fc.constantFrom(' ', '@', '#', '$', '!', '+', '/', '=', '(', ')'),
        fc.integer({min: 0x80, max: 0xFF}).map((c: number) => String.fromCharCode(c)),
    );

    // Arbitrary: verifier with valid length but containing at least one invalid char
    const invalidCharsetVerifierArb = fc.integer({min: 43, max: 128}).chain((len: number) =>
        fc.tuple(
            fc.integer({min: 0, max: len - 1}),
            invalidCharArb,
            fc.array(unreservedCharArb, {minLength: len - 1, maxLength: len - 1}),
        ).map(([pos, badChar, base]: [number, string, string[]]) => {
            const str = base.join('');
            return str.slice(0, pos) + badChar + str.slice(pos);
        }),
    );

    async function validateVerifier(verifier: string): Promise<boolean> {
        try {
            await ValidationSchema.CodeGrantSchema.validate({...validBase, code_verifier: verifier});
            return true;
        } catch {
            return false;
        }
    }

    it('accepts verifiers with valid length [43,128] and unreserved charset', async () => {
        await fc.assert(
            fc.asyncProperty(validVerifierArb, async (verifier: string) => {
                const result = await validateVerifier(verifier);
                expect(result).toBe(true);
            }),
            {numRuns: 200},
        );
    });

    it('rejects verifiers shorter than 43 characters', async () => {
        await fc.assert(
            fc.asyncProperty(tooShortVerifierArb, async (verifier: string) => {
                const result = await validateVerifier(verifier);
                expect(result).toBe(false);
            }),
            {numRuns: 200},
        );
    });

    it('rejects verifiers longer than 128 characters', async () => {
        await fc.assert(
            fc.asyncProperty(tooLongVerifierArb, async (verifier: string) => {
                const result = await validateVerifier(verifier);
                expect(result).toBe(false);
            }),
            {numRuns: 200},
        );
    });

    it('rejects verifiers with invalid characters even if length is valid', async () => {
        await fc.assert(
            fc.asyncProperty(invalidCharsetVerifierArb, async (verifier: string) => {
                const result = await validateVerifier(verifier);
                expect(result).toBe(false);
            }),
            {numRuns: 200},
        );
    });
});

/**
 * Feature: pkce-compliance, Property 2: S256 server-side round-trip
 *
 * For any valid code verifier (43-128 chars, unreserved charset),
 * computing BASE64URL(SHA256(verifier)) via CryptUtil.generateCodeChallenge(verifier, 'S256')
 * and then verifying the same verifier against the resulting challenge
 * should always succeed (the recomputed challenge equals the stored challenge).
 *
 * Validates: Requirements 2.1
 */
describe('Property 2: S256 server-side round-trip', () => {

    const UNRESERVED_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

    // Arbitrary: single valid unreserved character
    const unreservedCharArb = fc.constantFrom(...UNRESERVED_CHARS.split(''));

    // Arbitrary: valid code_verifier (length 43-128, unreserved charset)
    const validVerifierArb = fc.integer({min: 43, max: 128}).chain((len: number) =>
        fc.array(unreservedCharArb, {minLength: len, maxLength: len})
            .map((chars: string[]) => chars.join('')),
    );

    it('produces a stable challenge that re-verifies against the same verifier', () => {
        fc.assert(
            fc.property(validVerifierArb, (verifier: string) => {
                const challenge1 = CryptUtil.generateCodeChallenge(verifier, 'S256');
                const challenge2 = CryptUtil.generateCodeChallenge(verifier, 'S256');

                // Challenge must be a non-empty string
                expect(typeof challenge1).toBe('string');
                expect(challenge1.length).toBeGreaterThan(0);

                // Challenge must differ from the raw verifier (SHA-256 is not identity)
                expect(challenge1).not.toEqual(verifier);

                // Determinism: computing the challenge twice yields the same result
                expect(challenge1).toEqual(challenge2);
            }),
            {numRuns: 100},
        );
    });

    it('produces base64url-encoded output without padding', () => {
        fc.assert(
            fc.property(validVerifierArb, (verifier: string) => {
                const challenge = CryptUtil.generateCodeChallenge(verifier, 'S256');

                // Must be valid base64url (no +, /, or = characters)
                expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);

                // SHA-256 produces 32 bytes → base64url without padding is 43 chars
                expect(challenge.length).toBe(43);
            }),
            {numRuns: 100},
        );
    });
});

/**
 * Feature: pkce-compliance, Property 3: S256 cross-implementation consistency (UI ↔ Server)
 *
 * For any valid code verifier, the pure JS SHA-256 (UI fallback) produces the same
 * challenge as Node.js crypto.createHash('sha256') (server).
 *
 * Validates: Requirements 3.1, 3.5
 */

/**
 * Pure JavaScript SHA-256 implementation — identical to the one in
 * ui/src/app/_services/pkce.service.ts (sha256Fallback).
 * Duplicated here so the property test validates the algorithm itself
 * against Node's native crypto without depending on UI build tooling.
 */
function sha256Fallback(message: Uint8Array): Uint8Array {
    const K: number[] = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
        0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
        0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
        0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
        0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
        0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
        0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
        0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
        0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ];

    function rotr(n: number, x: number): number {
        return (x >>> n) | (x << (32 - n));
    }

    function ch(x: number, y: number, z: number): number {
        return (x & y) ^ (~x & z);
    }

    function maj(x: number, y: number, z: number): number {
        return (x & y) ^ (x & z) ^ (y & z);
    }

    function sigma0(x: number): number {
        return rotr(2, x) ^ rotr(13, x) ^ rotr(22, x);
    }

    function sigma1(x: number): number {
        return rotr(6, x) ^ rotr(11, x) ^ rotr(25, x);
    }

    function gamma0(x: number): number {
        return rotr(7, x) ^ rotr(18, x) ^ (x >>> 3);
    }

    function gamma1(x: number): number {
        return rotr(17, x) ^ rotr(19, x) ^ (x >>> 10);
    }

    const msgLen = message.length;
    const bitLen = msgLen * 8;
    const totalLen = Math.ceil((msgLen + 9) / 64) * 64;
    const padded = new Uint8Array(totalLen);
    padded.set(message);
    padded[msgLen] = 0x80;
    const view = new DataView(padded.buffer);
    view.setUint32(totalLen - 4, bitLen, false);

    let h0 = 0x6a09e667;
    let h1 = 0xbb67ae85;
    let h2 = 0x3c6ef372;
    let h3 = 0xa54ff53a;
    let h4 = 0x510e527f;
    let h5 = 0x9b05688c;
    let h6 = 0x1f83d9ab;
    let h7 = 0x5be0cd19;

    for (let offset = 0; offset < totalLen; offset += 64) {
        const W = new Array<number>(64);
        for (let t = 0; t < 16; t++) {
            W[t] = view.getUint32(offset + t * 4, false);
        }
        for (let t = 16; t < 64; t++) {
            W[t] = (gamma1(W[t - 2]) + W[t - 7] + gamma0(W[t - 15]) + W[t - 16]) | 0;
        }

        let a = h0, b = h1, c = h2, d = h3;
        let e = h4, f = h5, g = h6, h = h7;

        for (let t = 0; t < 64; t++) {
            const T1 = (h + sigma1(e) + ch(e, f, g) + K[t] + W[t]) | 0;
            const T2 = (sigma0(a) + maj(a, b, c)) | 0;
            h = g;
            g = f;
            f = e;
            e = (d + T1) | 0;
            d = c;
            c = b;
            b = a;
            a = (T1 + T2) | 0;
        }

        h0 = (h0 + a) | 0;
        h1 = (h1 + b) | 0;
        h2 = (h2 + c) | 0;
        h3 = (h3 + d) | 0;
        h4 = (h4 + e) | 0;
        h5 = (h5 + f) | 0;
        h6 = (h6 + g) | 0;
        h7 = (h7 + h) | 0;
    }

    const result = new Uint8Array(32);
    const rv = new DataView(result.buffer);
    rv.setUint32(0, h0, false);
    rv.setUint32(4, h1, false);
    rv.setUint32(8, h2, false);
    rv.setUint32(12, h3, false);
    rv.setUint32(16, h4, false);
    rv.setUint32(20, h5, false);
    rv.setUint32(24, h6, false);
    rv.setUint32(28, h7, false);
    return result;
}

function base64urlencode(buffer: ArrayBuffer): string {
    let str = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        str += String.fromCharCode(bytes[i]);
    }
    return Buffer.from(str, 'binary')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

function serverS256(verifier: string): string {
    const hash = createHash('sha256').update(verifier).digest();
    return hash
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

function uiFallbackS256(verifier: string): string {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = sha256Fallback(data);
    return base64urlencode(hash.buffer as ArrayBuffer);
}

describe('Property 3: S256 cross-implementation consistency (UI ↔ Server)', () => {

    const UNRESERVED_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const unreservedCharArb = fc.constantFrom(...UNRESERVED_CHARS.split(''));
    const validVerifierArb = fc.integer({min: 43, max: 128}).chain((len: number) =>
        fc.array(unreservedCharArb, {minLength: len, maxLength: len})
            .map((chars: string[]) => chars.join('')),
    );

    it('pure JS SHA-256 (UI fallback) produces the same challenge as Node.js crypto (server)', () => {
        fc.assert(
            fc.property(validVerifierArb, (verifier: string) => {
                const serverChallenge = serverS256(verifier);
                const uiChallenge = uiFallbackS256(verifier);

                expect(uiChallenge).toEqual(serverChallenge);
            }),
            {numRuns: 100},
        );
    });

    it('both implementations produce valid base64url output of 43 chars', () => {
        fc.assert(
            fc.property(validVerifierArb, (verifier: string) => {
                const serverChallenge = serverS256(verifier);
                const uiChallenge = uiFallbackS256(verifier);

                // SHA-256 → 32 bytes → base64url without padding = 43 chars
                expect(serverChallenge.length).toBe(43);
                expect(uiChallenge.length).toBe(43);

                // Valid base64url characters only
                expect(serverChallenge).toMatch(/^[A-Za-z0-9_-]+$/);
                expect(uiChallenge).toMatch(/^[A-Za-z0-9_-]+$/);
            }),
            {numRuns: 100},
        );
    });
});

/**
 * Feature: pkce-compliance, Property 4: Code verifier generation compliance
 *
 * For any verifier produced by the generation function,
 * length ∈ [43,128] AND charset ⊆ [A-Za-z0-9\-._~].
 *
 * The generation algorithm is replicated here from
 * ui/src/app/_services/pkce.service.ts (generateCodeVerifier)
 * to validate the algorithm itself in a Node.js environment.
 *
 * Validates: Requirements 6.1, 6.2
 */

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
const UNRESERVED_REGEX = /^[A-Za-z0-9\-._~]+$/;

/**
 * Replicates the UI's generateCodeVerifier algorithm using Node's crypto.
 * Uses the same mapping: byte % CHARSET.length for each random byte.
 */
function generateCodeVerifier(randomValues: Uint8Array): string {
    const length = 64;
    const bytes = randomValues.slice(0, length);
    return Array.from(bytes, (byte) => CHARSET[byte % CHARSET.length]).join('');
}

describe('Property 4: Code verifier generation compliance', () => {

    // Arbitrary: random Uint8Array of length 64 (simulating crypto.getRandomValues)
    const randomBytesArb = fc.uint8Array({minLength: 64, maxLength: 64});

    it('generated verifiers have length 64 (within [43, 128])', () => {
        fc.assert(
            fc.property(randomBytesArb, (bytes: Uint8Array) => {
                const verifier = generateCodeVerifier(bytes);

                expect(verifier.length).toBe(64);
                expect(verifier.length).toBeGreaterThanOrEqual(43);
                expect(verifier.length).toBeLessThanOrEqual(128);
            }),
            {numRuns: 100},
        );
    });

    it('generated verifiers contain only unreserved characters [A-Za-z0-9\\-._~]', () => {
        fc.assert(
            fc.property(randomBytesArb, (bytes: Uint8Array) => {
                const verifier = generateCodeVerifier(bytes);

                expect(verifier).toMatch(UNRESERVED_REGEX);
            }),
            {numRuns: 100},
        );
    });

    it('every character in the verifier belongs to the CHARSET', () => {
        fc.assert(
            fc.property(randomBytesArb, (bytes: Uint8Array) => {
                const verifier = generateCodeVerifier(bytes);

                for (const ch of verifier) {
                    expect(CHARSET).toContain(ch);
                }
            }),
            {numRuns: 100},
        );
    });

    it('uses all 66 characters from the unreserved set (statistical coverage)', () => {
        // Generate many verifiers and check that all charset characters appear at least once
        const seen = new Set<string>();
        for (let i = 0; i < 1000; i++) {
            const bytes = new Uint8Array(64);
            // Use Node's crypto for real randomness
            const buf = randomBytes(64);
            bytes.set(buf);
            const verifier = generateCodeVerifier(bytes);
            for (const ch of verifier) {
                seen.add(ch);
            }
        }
        // With 1000 * 64 = 64000 characters and 66 possible values, all should appear
        expect(seen.size).toBe(CHARSET.length);
    });
});

/**
 * PKCE Enforcement — Required PKCE, Voluntary PKCE, and Downgrade Prevention
 *
 * These tests verify that:
 * - Clients with requirePkce=true are rejected without code_challenge
 * - Voluntary PKCE (requirePkce=false + code_challenge provided) is validated at token exchange
 * - PKCE method downgrade from S256 to plain is prevented
 * - Pre-redirect errors (unknown client_id) return JSON 400
 *
 * Subproperties:
 * A) PKCE Required Enforcement: requirePkce=true + no code_challenge → redirect with error=invalid_request
 * B) Voluntary PKCE Honored: requirePkce=false + valid code_challenge S256 → flow succeeds, token exchange requires code_verifier
 * C) Downgrade Prevention: requirePkce=true + code_challenge_method=plain → redirect with error=invalid_request
 * D) Pre-redirect Errors: unknown client_id → JSON 400 (never redirect)
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 */
describe('PKCE Enforcement: required PKCE, voluntary PKCE, downgrade prevention, and error handling', () => {
    let fixture: SharedTestFixture;
    let tokenFixture: TokenFixture;
    let pkceRequiredClientId: string;
    let pkceOptionalClientId: string;

    const TENANT_DOMAIN = 'pkce-preservation-test.local';
    const ADMIN_EMAIL = `admin@${TENANT_DOMAIN}`;
    const ADMIN_PASSWORD = 'admin9000';
    const REDIRECT_URI = 'https://pkce-preservation.example.com/callback';

    // Helper: generate a valid S256 code_challenge from a code_verifier
    function generateS256Challenge(verifier: string): string {
        const hash = createHash('sha256').update(verifier).digest();
        return hash.toString('base64url');
    }

    beforeAll(async () => {
        fixture = new SharedTestFixture();
        tokenFixture = new TokenFixture(fixture);

        // Get tenant-scoped token to retrieve tenant ID
        const {jwt} = await tokenFixture.fetchAccessTokenFlow(
            ADMIN_EMAIL,
            ADMIN_PASSWORD,
            TENANT_DOMAIN,
        );
        const tenantId = jwt.tenant.id;

        // Get super-admin token to create clients
        const {accessToken: superToken} = await tokenFixture.fetchAccessTokenFlow(
            'admin@auth.server.com',
            'admin9000',
            'auth.server.com',
        );

        const clientApi = new ClientEntityClient(fixture, superToken);

        // Create client with requirePkce=true
        const pkceRequired = await clientApi.createClient(tenantId, 'PKCE Preservation Required Client', {
            redirectUris: [REDIRECT_URI],
            allowedScopes: 'openid profile email',
            isPublic: true,
            requirePkce: true,
        });
        pkceRequiredClientId = pkceRequired.client.clientId;

        // Create client with requirePkce=false (for voluntary PKCE)
        const pkceOptional = await clientApi.createClient(tenantId, 'PKCE Preservation Optional Client', {
            redirectUris: [REDIRECT_URI],
            allowedScopes: 'openid profile email',
            isPublic: true,
            requirePkce: false,
        });
        pkceOptionalClientId = pkceOptional.client.clientId;

        // Pre-grant consent for the optional PKCE client so /authorize issues codes directly
        await tokenFixture.preGrantConsentFlow(ADMIN_EMAIL, ADMIN_PASSWORD, {
            clientId: pkceOptionalClientId,
            redirectUri: REDIRECT_URI,
            scope: 'openid profile email',
            state: 'consent-state',
            codeChallenge: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopq',
            codeChallengeMethod: 'plain',
        });
    });

    afterAll(async () => {
        await fixture.close();
    });

    // --- Generators ---

    // Valid state strings (URL-safe)
    const stateArb = fc.stringMatching(/^[A-Za-z0-9_\-]{8,64}$/);

    // Valid scope subsets from the client's allowed scopes
    const scopeArb = fc.subarray(['openid', 'profile', 'email'], {minLength: 1})
        .map(scopes => scopes.join(' '));

    // Valid PKCE code_verifier: 43-128 chars from unreserved charset
    const UNRESERVED_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const verifierArb = fc.integer({min: 43, max: 128}).chain((len: number) =>
        fc.array(fc.constantFrom(...UNRESERVED_CHARS.split('')), {minLength: len, maxLength: len})
            .map((chars: string[]) => chars.join('')),
    );

    // Unknown client_id values that cannot match real clients
    const unknownClientIdArb = fc.stringMatching(/^[A-Za-z0-9_\-]{8,32}$/)
        .map(s => `unknown-pkce-${s}`);

    // --- Sub-property A: PKCE Required Enforcement ---
    describe('Sub-property A: PKCE Required Enforcement', () => {
        it('requirePkce=true + no code_challenge → redirect with error=invalid_request', async () => {
            await fc.assert(
                fc.asyncProperty(stateArb, scopeArb, async (state, scope) => {
                    const res = await fixture.getHttpServer()
                        .get('/api/oauth/authorize')
                        .query({
                            response_type: 'code',
                            client_id: pkceRequiredClientId,
                            redirect_uri: REDIRECT_URI,
                            scope,
                            state,
                        })
                        .redirects(0);

                    // Post-redirect error: 302 redirect with error params
                    expect(res.status).toEqual(302);
                    const location = res.headers['location'] as string;
                    expect(location).toBeDefined();

                    const redirectUrl = new URL(location, 'http://localhost');
                    expect(redirectUrl.searchParams.get('error')).toEqual('invalid_request');
                    expect(redirectUrl.searchParams.has('error_description')).toBe(true);
                    expect(redirectUrl.searchParams.get('state')).toEqual(state);
                }),
                {numRuns: 20},
            );
        }, 180_000);
    });

    // --- Sub-property B: Voluntary PKCE Honored ---
    describe('Sub-property B: Voluntary PKCE Honored', () => {
        it('requirePkce=false + valid S256 code_challenge → full flow succeeds and token exchange requires code_verifier', async () => {
            await fc.assert(
                fc.asyncProperty(stateArb, scopeArb, verifierArb, async (state, scope, verifier) => {
                    const codeChallenge = generateS256Challenge(verifier);

                    // Login → get sid cookie → authorize with S256 code_challenge → get auth code
                    const params = {
                        clientId: pkceOptionalClientId,
                        redirectUri: REDIRECT_URI,
                        scope,
                        state,
                        codeChallenge,
                        codeChallengeMethod: 'S256',
                    };
                    const csrfContext = await tokenFixture.initializeFlow(params);
                    const sidCookie = await tokenFixture.login(ADMIN_EMAIL, ADMIN_PASSWORD, pkceOptionalClientId, csrfContext);
                    const code = await tokenFixture.getAuthorizationCode(params, sidCookie, csrfContext.flowIdCookie);

                    // Token exchange WITH correct code_verifier → should succeed
                    const tokenRes = await fixture.getHttpServer()
                        .post('/api/oauth/token')
                        .send({
                            grant_type: 'authorization_code',
                            code,
                            client_id: pkceOptionalClientId,
                            redirect_uri: REDIRECT_URI,
                            code_verifier: verifier,
                        })
                        .set('Accept', 'application/json');

                    expect(tokenRes.status).toEqual(200);
                    expect(tokenRes.body.access_token).toBeDefined();
                    expect(tokenRes.body.token_type).toEqual('Bearer');
                }),
                {numRuns: 10},
            );
        }, 180_000);

        it('requirePkce=false + valid S256 code_challenge → token exchange with WRONG code_verifier fails', async () => {
            await fc.assert(
                fc.asyncProperty(stateArb, scopeArb, verifierArb, verifierArb, async (state, scope, verifier, wrongVerifier) => {
                    // Ensure the wrong verifier is actually different
                    fc.pre(verifier !== wrongVerifier);

                    const codeChallenge = generateS256Challenge(verifier);

                    // Login → authorize with S256 → get auth code
                    const params2 = {
                        clientId: pkceOptionalClientId,
                        redirectUri: REDIRECT_URI,
                        scope,
                        state,
                        codeChallenge,
                        codeChallengeMethod: 'S256',
                    };
                    const csrfContext2 = await tokenFixture.initializeFlow(params2);
                    const sidCookie = await tokenFixture.login(ADMIN_EMAIL, ADMIN_PASSWORD, pkceOptionalClientId, csrfContext2);
                    const code = await tokenFixture.getAuthorizationCode(params2, sidCookie, csrfContext2.flowIdCookie);

                    // Token exchange with WRONG code_verifier → should fail
                    const tokenRes = await fixture.getHttpServer()
                        .post('/api/oauth/token')
                        .send({
                            grant_type: 'authorization_code',
                            code,
                            client_id: pkceOptionalClientId,
                            redirect_uri: REDIRECT_URI,
                            code_verifier: wrongVerifier,
                        })
                        .set('Accept', 'application/json');

                    // Should reject with an error (invalid_grant or similar)
                    expect(tokenRes.status).toBeGreaterThanOrEqual(400);
                    expect(tokenRes.body.error).toBeDefined();
                }),
                {numRuns: 10},
            );
        }, 180_000);
    });

    // --- Sub-property C: Downgrade Prevention ---
    describe('Sub-property C: Downgrade Prevention', () => {
        it('requirePkce=true + code_challenge_method=plain → redirect with error=invalid_request', async () => {
            await fc.assert(
                fc.asyncProperty(stateArb, scopeArb, verifierArb, async (state, scope, verifier) => {
                    // Use the verifier as a plain challenge (plain method = challenge equals verifier)
                    const res = await fixture.getHttpServer()
                        .get('/api/oauth/authorize')
                        .query({
                            response_type: 'code',
                            client_id: pkceRequiredClientId,
                            redirect_uri: REDIRECT_URI,
                            scope,
                            state,
                            code_challenge: verifier,
                            code_challenge_method: 'plain',
                        })
                        .redirects(0);

                    // Post-redirect error: 302 redirect with error params
                    expect(res.status).toEqual(302);
                    const location = res.headers['location'] as string;
                    expect(location).toBeDefined();

                    const redirectUrl = new URL(location, 'http://localhost');
                    expect(redirectUrl.searchParams.get('error')).toEqual('invalid_request');
                    expect(redirectUrl.searchParams.has('error_description')).toBe(true);
                    expect(redirectUrl.searchParams.get('state')).toEqual(state);
                }),
                {numRuns: 20},
            );
        }, 180_000);
    });

    // --- Sub-property D: Pre-redirect Errors ---
    describe('Sub-property D: Pre-redirect Errors', () => {
        it('unknown client_id → JSON 400 (never redirect)', async () => {
            await fc.assert(
                fc.asyncProperty(unknownClientIdArb, stateArb, async (clientId, state) => {
                    const res = await fixture.getHttpServer()
                        .get('/api/oauth/authorize')
                        .query({
                            response_type: 'code',
                            client_id: clientId,
                            redirect_uri: 'https://any.example.com/callback',
                            scope: 'openid',
                            state,
                        })
                        .redirects(0);

                    // Must NOT be a 302 redirect — pre-redirect error
                    expect(res.status).not.toEqual(302);
                    // Should return a JSON error body with status 400
                    expect(res.status).toEqual(400);
                    expect(res.body.error).toBeDefined();
                }),
                {numRuns: 20},
            );
        }, 180_000);
    });
});

/**
 * PKCE Optional Flow — Full authorize → token exchange without PKCE
 *
 * _For any_ authorization request where `client.requirePkce=false` AND no
 * `code_challenge` is provided, the `/api/oauth/authorize` endpoint SHALL
 * redirect to frontend without PKCE params, AND the full flow SHALL succeed
 * without `code_verifier` at token exchange.
 *
 * **Validates: Requirements 2.1, 2.2**
 *
 * Verifies that clients with requirePkce=false can complete the OAuth flow without PKCE.
 */
describe('PKCE Optional Flow: authorize → token exchange without code_challenge', () => {
    let fixture: SharedTestFixture;
    let tokenFixture: TokenFixture;
    let testClientId: string;

    const TENANT_DOMAIN = 'pkce-bug-condition-test.local';
    const ADMIN_EMAIL = `admin@${TENANT_DOMAIN}`;
    const ADMIN_PASSWORD = 'admin9000';
    const REDIRECT_URI = 'https://pkce-bug-condition.example.com/callback';

    beforeAll(async () => {
        fixture = new SharedTestFixture();
        tokenFixture = new TokenFixture(fixture);

        // Get a tenant-scoped token for the test tenant to retrieve its ID
        const {jwt} = await tokenFixture.fetchAccessTokenFlow(
            ADMIN_EMAIL,
            ADMIN_PASSWORD,
            TENANT_DOMAIN,
        );
        const tenantId = jwt.tenant.id;

        // Get super-admin token to create a client
        const {accessToken: superToken} = await tokenFixture.fetchAccessTokenFlow(
            'admin@auth.server.com',
            'admin9000',
            'auth.server.com',
        );

        const clientApi = new ClientEntityClient(fixture, superToken);

        // Create a client with requirePkce=false and isPublic=true
        const created = await clientApi.createClient(tenantId, 'PKCE Bug Condition Client', {
            redirectUris: [REDIRECT_URI],
            allowedScopes: 'openid profile email',
            isPublic: true,
            requirePkce: false,
        });
        testClientId = created.client.clientId;

        // Pre-grant consent so /authorize issues codes directly
        // (third-party clients require consent)
        await tokenFixture.preGrantConsentFlow(ADMIN_EMAIL, ADMIN_PASSWORD, {
            clientId: testClientId,
            redirectUri: REDIRECT_URI,
            scope: 'openid profile email',
            state: 'consent-state',
            codeChallenge: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopq',
            codeChallengeMethod: 'plain',
        });
    });

    afterAll(async () => {
        await fixture.close();
    });

    // Generators
    const stateArb = fc.stringMatching(/^[A-Za-z0-9_\-]{8,64}$/);
    const scopeArb = fc.subarray(['openid', 'profile', 'email'], {minLength: 1})
        .map(scopes => scopes.join(' '));

    it('optional PKCE: full authorize → token exchange succeeds without PKCE', async () => {
        await fc.assert(
            fc.asyncProperty(stateArb, scopeArb, async (state, scope) => {
                // Step 1: Login to get a sid cookie
                const sidCookie = await tokenFixture.fetchSidCookieFlow(ADMIN_EMAIL, ADMIN_PASSWORD, {
                    clientId: testClientId,
                    redirectUri: REDIRECT_URI,
                    scope: 'openid profile email',
                    state: 'test-state',
                    codeChallenge: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopq',
                    codeChallengeMethod: 'plain',
                });

                // Step 2: GET /api/oauth/authorize WITHOUT code_challenge
                const authorizeRes = await fixture.getHttpServer()
                    .get('/api/oauth/authorize')
                    .query({
                        response_type: 'code',
                        client_id: testClientId,
                        redirect_uri: REDIRECT_URI,
                        scope,
                        state,
                        session_confirmed: 'true',
                    })
                    .set('Cookie', sidCookie)
                    .redirects(0);

                // Expect 302 redirect to the client's redirect URI with a code
                expect(authorizeRes.status).toEqual(302);
                const location = authorizeRes.headers['location'] as string;
                expect(location).toBeDefined();

                const redirectUrl = new URL(location, 'http://localhost');
                expect(redirectUrl.searchParams.has('error')).toBe(false);
                const code = redirectUrl.searchParams.get('code');
                expect(code).toBeDefined();

                // Step 3: POST /api/oauth/token WITHOUT code_verifier
                const tokenRes = await fixture.getHttpServer()
                    .post('/api/oauth/token')
                    .send({
                        grant_type: 'authorization_code',
                        code,
                        client_id: testClientId,
                        redirect_uri: REDIRECT_URI,
                    })
                    .set('Accept', 'application/json');

                // Token exchange should succeed with access_token
                expect(tokenRes.status).toEqual(200);
                expect(tokenRes.body.access_token).toBeDefined();
                expect(tokenRes.body.token_type).toEqual('Bearer');
            }),
            {numRuns: 10},
        );
    }, 180_000);
});
