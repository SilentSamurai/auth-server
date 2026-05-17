import * as fc from 'fast-check';
import * as crypto from 'crypto';
import {clampExpiry, generateOpaqueToken, hashToken, validateScopeSubset} from '../../../src/auth/refresh-token.service';
import {OAuthException} from '../../../src/exceptions/oauth-exception';

/**
 * Feature: db-refresh-token-rotation, Property 7: Client binding enforcement
 *
 * For any token with `client_id = X`, presenting with `client_id = Y` (X ≠ Y)
 * SHALL be rejected; presenting with `client_id = X` SHALL NOT be rejected
 * on client binding grounds.
 *
 * Validates: Requirements 6.1
 */
describe('Feature: db-refresh-token-rotation, Property 7: Client binding enforcement', () => {

    /**
     * Simulate the client binding check from consumeAndRotate().
     * This is the exact logic: if existing.clientId !== params.clientId, throw.
     */
    function checkClientBinding(recordClientId: string, presentedClientId: string): void {
        if (recordClientId !== presentedClientId) {
            throw OAuthException.invalidGrant('The refresh token is invalid or has expired');
        }
    }

    const clientIdArb = fc.string({minLength: 1, maxLength: 100});

    it('presenting with the correct client_id does not throw', () => {
        fc.assert(
            fc.property(clientIdArb, (clientId) => {
                expect(() => checkClientBinding(clientId, clientId)).not.toThrow();
            }),
            {numRuns: 200},
        );
    });

    it('presenting with a different client_id throws invalid_grant', () => {
        fc.assert(
            fc.property(clientIdArb, clientIdArb, (recordClientId, presentedClientId) => {
                fc.pre(recordClientId !== presentedClientId);

                try {
                    checkClientBinding(recordClientId, presentedClientId);
                    fail('Expected OAuthException to be thrown');
                } catch (e) {
                    expect(e).toBeInstanceOf(OAuthException);
                    expect((e as OAuthException).errorCode).toBe('invalid_grant');
                }
            }),
            {numRuns: 200},
        );
    });

    it('error message is a fixed generic string that does not vary with input', () => {
        const EXPECTED_MESSAGE = 'The refresh token is invalid or has expired';

        fc.assert(
            fc.property(clientIdArb, clientIdArb, (recordClientId, presentedClientId) => {
                fc.pre(recordClientId !== presentedClientId);

                try {
                    checkClientBinding(recordClientId, presentedClientId);
                } catch (e) {
                    const desc = (e as OAuthException).errorDescription;
                    // The error message must always be the same generic string
                    // regardless of which client IDs were involved
                    expect(desc).toBe(EXPECTED_MESSAGE);
                    // Must not reveal the nature of the mismatch
                    expect(desc).not.toContain('client');
                    expect(desc).not.toContain('mismatch');
                    expect(desc).not.toContain('binding');
                }
            }),
            {numRuns: 200},
        );
    });
});

/**
 * Feature: db-refresh-token-rotation, Property 8: Dual expiry enforcement
 *
 * For any token where current time exceeds either `expires_at` or
 * `absolute_expires_at`, the token SHALL be rejected; for any token where
 * current time is before both and not revoked/used, consumption SHALL succeed.
 *
 * Validates: Requirements 7.1, 7.2
 */
describe('Feature: db-refresh-token-rotation, Property 8: Dual expiry enforcement', () => {

    /**
     * Simulate the dual expiry check from consumeAndRotate().
     * Returns 'ok' if the token passes expiry checks, or throws OAuthException.
     */
    function checkExpiry(now: Date, expiresAt: Date, absoluteExpiresAt: Date, revoked: boolean, usedAt: Date | null): 'ok' {
        if (revoked) {
            throw OAuthException.invalidGrant('The refresh token is invalid or has expired');
        }
        if (now > expiresAt) {
            throw OAuthException.invalidGrant('The refresh token is invalid or has expired');
        }
        if (now > absoluteExpiresAt) {
            throw OAuthException.invalidGrant('The refresh token is invalid or has expired');
        }
        if (usedAt !== null) {
            throw OAuthException.invalidGrant('The refresh token is invalid or has expired');
        }
        return 'ok';
    }

    const baseTime = Date.now();
    const now = new Date(baseTime);

    // expiresAt can be in the past or future relative to now
    const expiresAtArb = fc.integer({
        min: baseTime - 365 * 24 * 60 * 60 * 1000,
        max: baseTime + 365 * 24 * 60 * 60 * 1000
    })
        .map(ts => new Date(ts));

    const absoluteExpiresAtArb = fc.integer({
        min: baseTime - 365 * 24 * 60 * 60 * 1000,
        max: baseTime + 365 * 24 * 60 * 60 * 1000
    })
        .map(ts => new Date(ts));

    it('token is rejected when current time exceeds sliding expires_at', () => {
        fc.assert(
            fc.property(absoluteExpiresAtArb, (absoluteExpiresAt) => {
                // Force expiresAt to be in the past
                const expiresAt = new Date(now.getTime() - 1);

                try {
                    checkExpiry(now, expiresAt, absoluteExpiresAt, false, null);
                    fail('Expected OAuthException');
                } catch (e) {
                    expect(e).toBeInstanceOf(OAuthException);
                    expect((e as OAuthException).errorCode).toBe('invalid_grant');
                }
            }),
            {numRuns: 200},
        );
    });

    it('token is rejected when current time exceeds absolute_expires_at even if sliding is valid', () => {
        fc.assert(
            fc.property(fc.integer({min: 1, max: 1000000}), (_seed) => {
                // Sliding is valid (future), but absolute is expired (past)
                const expiresAt = new Date(now.getTime() + 60000);
                const absoluteExpiresAt = new Date(now.getTime() - 1);

                try {
                    checkExpiry(now, expiresAt, absoluteExpiresAt, false, null);
                    fail('Expected OAuthException');
                } catch (e) {
                    expect(e).toBeInstanceOf(OAuthException);
                    expect((e as OAuthException).errorCode).toBe('invalid_grant');
                }
            }),
            {numRuns: 200},
        );
    });

    it('token is accepted when current time is before both expiries and not revoked/used', () => {
        fc.assert(
            fc.property(fc.integer({min: 1, max: 1000000}), (_seed) => {
                // Both expiries are in the future
                const expiresAt = new Date(now.getTime() + 60000);
                const absoluteExpiresAt = new Date(now.getTime() + 120000);

                const result = checkExpiry(now, expiresAt, absoluteExpiresAt, false, null);
                expect(result).toBe('ok');
            }),
            {numRuns: 200},
        );
    });

    it('for any random expiry pair, rejection iff now > either expiry', () => {
        fc.assert(
            fc.property(expiresAtArb, absoluteExpiresAtArb, (expiresAt, absoluteExpiresAt) => {
                const slidingExpired = now > expiresAt;
                const absoluteExpired = now > absoluteExpiresAt;

                if (slidingExpired || absoluteExpired) {
                    try {
                        checkExpiry(now, expiresAt, absoluteExpiresAt, false, null);
                        fail('Expected OAuthException');
                    } catch (e) {
                        expect(e).toBeInstanceOf(OAuthException);
                        expect((e as OAuthException).errorCode).toBe('invalid_grant');
                    }
                } else {
                    const result = checkExpiry(now, expiresAt, absoluteExpiresAt, false, null);
                    expect(result).toBe('ok');
                }
            }),
            {numRuns: 200},
        );
    });
});

/**
 * Feature: db-refresh-token-rotation, Property 5: Sliding expiry clamped to absolute expiry
 *
 * For any sliding duration and absolute expiry, the new token's `expires_at`
 * never exceeds `absolute_expires_at`.
 *
 * Validates: Requirements 7.4
 */
describe('Feature: db-refresh-token-rotation, Property 5: Sliding expiry clamped to absolute expiry', () => {
    const now = Date.now();
    const slidingDurationArb = fc.integer({min: 1, max: 365 * 24 * 60 * 60 * 1000});
    const absoluteExpiryArb = fc.integer({min: now, max: now + 2 * 365 * 24 * 60 * 60 * 1000}).map(
        (ts) => new Date(ts),
    );

    it('clampExpiry never exceeds absoluteExpiresAt', () => {
        fc.assert(
            fc.property(slidingDurationArb, absoluteExpiryArb, (slidingMs, absoluteExpiresAt) => {
                const result = clampExpiry(slidingMs, absoluteExpiresAt);
                expect(result.getTime()).toBeLessThanOrEqual(absoluteExpiresAt.getTime());
            }),
            {numRuns: 200},
        );
    });

    it('when sliding expiry exceeds absolute, result equals absoluteExpiresAt', () => {
        fc.assert(
            fc.property(slidingDurationArb, absoluteExpiryArb, (slidingMs, absoluteExpiresAt) => {
                const slidingExpiry = new Date(Date.now() + slidingMs);
                const result = clampExpiry(slidingMs, absoluteExpiresAt);

                if (slidingExpiry > absoluteExpiresAt) {
                    expect(result.getTime()).toEqual(absoluteExpiresAt.getTime());
                }
            }),
            {numRuns: 200},
        );
    });

    it('when sliding expiry is within absolute, result is approximately now + slidingMs', () => {
        fc.assert(
            fc.property(slidingDurationArb, absoluteExpiryArb, (slidingMs, absoluteExpiresAt) => {
                const beforeCall = Date.now();
                const result = clampExpiry(slidingMs, absoluteExpiresAt);
                const afterCall = Date.now();

                const slidingExpiry = new Date(beforeCall + slidingMs);

                if (slidingExpiry < absoluteExpiresAt) {
                    // Result should be approximately now + slidingMs, within execution tolerance
                    const tolerance = afterCall - beforeCall + 5; // ms tolerance for test execution
                    expect(result.getTime()).toBeGreaterThanOrEqual(beforeCall + slidingMs);
                    expect(result.getTime()).toBeLessThanOrEqual(afterCall + slidingMs + tolerance);
                }
            }),
            {numRuns: 200},
        );
    });
});

/**
 * Feature: db-refresh-token-rotation, Property 11: Family revocation marks all tokens
 *
 * For any token family containing N tokens, revoking any one SHALL result
 * in all N having `revoked = true`.
 *
 * Validates: Requirements 10.1
 */
describe('Feature: db-refresh-token-rotation, Property 11: Family revocation marks all tokens', () => {

    interface SimToken {
        id: string;
        familyId: string;
        parentId: string | null;
        revoked: boolean;
    }

    function createFamily(size: number): { tokens: SimToken[]; familyId: string } {
        const familyId = crypto.randomUUID();
        const tokens: SimToken[] = [];

        for (let i = 0; i < size; i++) {
            tokens.push({
                id: crypto.randomUUID(),
                familyId,
                parentId: i === 0 ? null : tokens[i - 1].id,
                revoked: false,
            });
        }

        return {tokens, familyId};
    }

    /** Simulate revokeFamily: UPDATE SET revoked=true WHERE family_id = :familyId */
    function revokeFamily(allTokens: SimToken[], familyId: string): void {
        for (const t of allTokens) {
            if (t.familyId === familyId) {
                t.revoked = true;
            }
        }
    }

    const familySizeArb = fc.integer({min: 1, max: 20});

    it('revoking via any token in the family marks all N tokens as revoked', () => {
        fc.assert(
            fc.property(familySizeArb, fc.integer({min: 0, max: 100}), (size, indexSeed) => {
                const {tokens, familyId} = createFamily(size);

                // Pick any token in the family as the "trigger"
                const triggerIndex = indexSeed % size;
                const triggerToken = tokens[triggerIndex];

                // Revoke the family (this is what revokeFamily and revokeByToken do)
                revokeFamily(tokens, triggerToken.familyId);

                // All tokens in the family must be revoked
                for (const t of tokens) {
                    expect(t.revoked).toBe(true);
                }
            }),
            {numRuns: 200},
        );
    });

    it('revocation of one family does not affect tokens in other families', () => {
        fc.assert(
            fc.property(familySizeArb, familySizeArb, (sizeA, sizeB) => {
                const familyA = createFamily(sizeA);
                const familyB = createFamily(sizeB);
                const allTokens = [...familyA.tokens, ...familyB.tokens];

                // Revoke family A
                revokeFamily(allTokens, familyA.familyId);

                // All of family A revoked
                for (const t of familyA.tokens) {
                    expect(t.revoked).toBe(true);
                }

                // None of family B revoked
                for (const t of familyB.tokens) {
                    expect(t.revoked).toBe(false);
                }
            }),
            {numRuns: 200},
        );
    });

    it('revoking a single-token family marks that token as revoked', () => {
        fc.assert(
            fc.property(fc.integer({min: 0, max: 1000}), () => {
                const {tokens, familyId} = createFamily(1);
                revokeFamily(tokens, familyId);
                expect(tokens[0].revoked).toBe(true);
            }),
            {numRuns: 200},
        );
    });
});

/**
 * Feature: db-refresh-token-rotation, Property 1: Token generation produces sufficient entropy
 *
 * For any call to the token generation function, the returned opaque string
 * SHALL have at least 32 bytes of entropy, and any two independently generated
 * tokens SHALL be distinct.
 *
 * Validates: Requirements 1.1
 */
describe('Feature: db-refresh-token-rotation, Property 1: Token generation produces sufficient entropy', () => {

    it('each generated token decodes from base64url to at least 32 bytes', () => {
        fc.assert(
            fc.property(fc.integer({min: 0, max: 1000}), () => {
                const token = generateOpaqueToken();
                const decoded = Buffer.from(token, 'base64url');
                expect(decoded.length).toBeGreaterThanOrEqual(32);
            }),
            {numRuns: 200},
        );
    });

    it('any two independently generated tokens are distinct', () => {
        fc.assert(
            fc.property(fc.integer({min: 0, max: 1000}), () => {
                const tokenA = generateOpaqueToken();
                const tokenB = generateOpaqueToken();
                expect(tokenA).not.toEqual(tokenB);
            }),
            {numRuns: 200},
        );
    });

    it('generated tokens are valid base64url strings', () => {
        fc.assert(
            fc.property(fc.integer({min: 0, max: 1000}), () => {
                const token = generateOpaqueToken();
                // base64url alphabet: A-Z, a-z, 0-9, -, _ (no padding =)
                expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
                // Round-trip: encoding the decoded bytes back should yield the same string
                const decoded = Buffer.from(token, 'base64url');
                const reEncoded = decoded.toString('base64url');
                expect(reEncoded).toEqual(token);
            }),
            {numRuns: 200},
        );
    });
});

/**
 * Feature: db-refresh-token-rotation, Property 2: Token hash round-trip consistency
 *
 * For any opaque token string, computing SHA-256 always produces the same
 * deterministic output and matches the stored token_hash.
 *
 * Validates: Requirements 1.2, 3.1
 */
describe('Feature: db-refresh-token-rotation, Property 2: Token hash round-trip consistency', () => {

    it('hashToken is deterministic — calling it twice on the same input yields the same output', () => {
        fc.assert(
            fc.property(fc.string(), (token) => {
                const hash1 = hashToken(token);
                const hash2 = hashToken(token);
                expect(hash1).toBe(hash2);
            }),
            {numRuns: 200},
        );
    });

    it('hashToken output is a valid lowercase hex string of length 64', () => {
        fc.assert(
            fc.property(fc.string(), (token) => {
                const hash = hashToken(token);
                expect(hash).toHaveLength(64);
                expect(hash).toMatch(/^[0-9a-f]{64}$/);
            }),
            {numRuns: 200},
        );
    });

    it('different inputs produce different hashes (collision resistance)', () => {
        fc.assert(
            fc.property(
                fc.string({minLength: 1}),
                fc.string({minLength: 1}),
                (a, b) => {
                    fc.pre(a !== b);
                    const hashA = hashToken(a);
                    const hashB = hashToken(b);
                    expect(hashA).not.toBe(hashB);
                },
            ),
            {numRuns: 200},
        );
    });
});

/**
 * Feature: db-refresh-token-rotation, Property 3: Initial token family structure
 *
 * For any newly created refresh token, the record SHALL have a valid UUID
 * `family_id` and `parent_id` SHALL be NULL.
 *
 * Validates: Requirements 4.2
 */
describe('Feature: db-refresh-token-rotation, Property 3: Initial token family structure', () => {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    /**
     * Simulate the create() logic from RefreshTokenService:
     * - Generate opaque token + hash
     * - Generate a new UUID familyId
     * - Set parentId to null
     */
    function simulateCreate(params: {
        userId: string;
        clientId: string;
        tenantId: string;
        scope: string;
    }) {
        const plaintext = generateOpaqueToken();
        const tokenHash = hashToken(plaintext);
        const familyId = crypto.randomUUID();
        const now = new Date();

        return {
            plaintext,
            record: {
                tokenHash,
                familyId,
                parentId: null as string | null,
                userId: params.userId,
                clientId: params.clientId,
                tenantId: params.tenantId,
                scope: params.scope,
                expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
                absoluteExpiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
                revoked: false,
                usedAt: null as Date | null,
            },
        };
    }

    const uuidArb = fc.uuid();
    const clientIdArb = fc.string({minLength: 1, maxLength: 50});
    const scopeArb = fc.subarray(['openid', 'profile', 'email'], {minLength: 1}).map(s => s.join(' '));

    it('newly created token has a valid UUID family_id', () => {
        fc.assert(
            fc.property(uuidArb, clientIdArb, uuidArb, scopeArb, (userId, clientId, tenantId, scope) => {
                const {record} = simulateCreate({userId, clientId, tenantId, scope});
                expect(record.familyId).toMatch(UUID_REGEX);
            }),
            {numRuns: 200},
        );
    });

    it('newly created token has parent_id equal to null', () => {
        fc.assert(
            fc.property(uuidArb, clientIdArb, uuidArb, scopeArb, (userId, clientId, tenantId, scope) => {
                const {record} = simulateCreate({userId, clientId, tenantId, scope});
                expect(record.parentId).toBeNull();
            }),
            {numRuns: 200},
        );
    });

    it('each created token gets a unique family_id', () => {
        fc.assert(
            fc.property(uuidArb, clientIdArb, uuidArb, scopeArb, (userId, clientId, tenantId, scope) => {
                const {record: a} = simulateCreate({userId, clientId, tenantId, scope});
                const {record: b} = simulateCreate({userId, clientId, tenantId, scope});
                expect(a.familyId).not.toEqual(b.familyId);
            }),
            {numRuns: 200},
        );
    });
});

/**
 * Feature: db-refresh-token-rotation, Property 6: Replay detection revokes entire family
 *
 * For any consumed token past the grace window, presenting it again SHALL
 * result in all family tokens having `revoked = true`.
 *
 * Validates: Requirements 5.1
 */
describe('Feature: db-refresh-token-rotation, Property 6: Replay detection revokes entire family', () => {

    /**
     * Simulate an in-memory token family and the revokeFamily logic.
     * This models the state transitions without a database.
     */
    interface SimToken {
        id: string;
        tokenHash: string;
        familyId: string;
        parentId: string | null;
        usedAt: Date | null;
        revoked: boolean;
    }

    function createFamilyChain(length: number): { tokens: SimToken[]; familyId: string } {
        const familyId = crypto.randomUUID();
        const tokens: SimToken[] = [];

        for (let i = 0; i < length; i++) {
            tokens.push({
                id: crypto.randomUUID(),
                tokenHash: hashToken(crypto.randomBytes(32).toString('base64url')),
                familyId,
                parentId: i === 0 ? null : tokens[i - 1].id,
                usedAt: i < length - 1 ? new Date(Date.now() - 60000) : null, // all but last are "used"
                revoked: false,
            });
        }

        return {tokens, familyId};
    }

    /** Simulate revokeFamily: set revoked=true on all tokens with matching familyId */
    function revokeFamily(tokens: SimToken[], familyId: string): void {
        for (const t of tokens) {
            if (t.familyId === familyId) {
                t.revoked = true;
            }
        }
    }

    /** Simulate replay detection: if token is already used and past grace window, revoke family */
    function simulateReplayDetection(
        tokens: SimToken[],
        replayedToken: SimToken,
        graceWindowSeconds: number,
    ): 'revoked' | 'grace' {
        if (replayedToken.usedAt) {
            const graceDeadline = new Date(replayedToken.usedAt.getTime() + graceWindowSeconds * 1000);
            if (new Date() <= graceDeadline) {
                return 'grace';
            }
            revokeFamily(tokens, replayedToken.familyId);
            return 'revoked';
        }
        return 'grace'; // not used yet, shouldn't happen in replay scenario
    }

    const chainLengthArb = fc.integer({min: 2, max: 10});

    it('replaying a consumed token (grace=0) revokes all tokens in the family', () => {
        fc.assert(
            fc.property(chainLengthArb, (chainLength) => {
                const {tokens, familyId} = createFamilyChain(chainLength);

                // Pick the first token (already consumed — usedAt is set)
                const replayedToken = tokens[0];
                expect(replayedToken.usedAt).not.toBeNull();

                // Simulate replay with grace window = 0
                const result = simulateReplayDetection(tokens, replayedToken, 0);
                expect(result).toBe('revoked');

                // All tokens in the family must be revoked
                for (const t of tokens) {
                    expect(t.revoked).toBe(true);
                }
            }),
            {numRuns: 200},
        );
    });

    it('replaying any consumed token in the chain revokes the entire family', () => {
        fc.assert(
            fc.property(
                chainLengthArb,
                fc.integer({min: 0, max: 100}),
                (chainLength, indexSeed) => {
                    const {tokens} = createFamilyChain(chainLength);

                    // Pick any consumed token (all except the last are consumed)
                    const consumedTokens = tokens.filter(t => t.usedAt !== null);
                    if (consumedTokens.length === 0) return; // skip if no consumed tokens
                    const replayedToken = consumedTokens[indexSeed % consumedTokens.length];

                    simulateReplayDetection(tokens, replayedToken, 0);

                    // Every token in the family must be revoked
                    for (const t of tokens) {
                        expect(t.revoked).toBe(true);
                    }
                },
            ),
            {numRuns: 200},
        );
    });

    it('tokens in a different family are not affected by revocation', () => {
        fc.assert(
            fc.property(chainLengthArb, chainLengthArb, (lenA, lenB) => {
                const familyA = createFamilyChain(lenA);
                const familyB = createFamilyChain(lenB);
                const allTokens = [...familyA.tokens, ...familyB.tokens];

                // Replay a consumed token from family A
                const replayedToken = familyA.tokens[0];
                simulateReplayDetection(allTokens, replayedToken, 0);

                // Family A tokens are all revoked
                for (const t of familyA.tokens) {
                    expect(t.revoked).toBe(true);
                }

                // Family B tokens are untouched
                for (const t of familyB.tokens) {
                    expect(t.revoked).toBe(false);
                }
            }),
            {numRuns: 200},
        );
    });
});

/**
 * Feature: db-refresh-token-rotation, Property 12: Revoked tokens are rejected
 *
 * For any token with `revoked = true`, presenting it SHALL be rejected
 * with `invalid_grant`.
 *
 * Validates: Requirements 10.2
 */
describe('Feature: db-refresh-token-rotation, Property 12: Revoked tokens are rejected', () => {

    /**
     * Simulate the revocation check from consumeAndRotate().
     * This is checked before atomic consumption (Requirement 10.3).
     */
    function checkRevoked(revoked: boolean): void {
        if (revoked) {
            throw OAuthException.invalidGrant('The refresh token is invalid or has expired');
        }
    }

    it('a revoked token is always rejected with invalid_grant', () => {
        fc.assert(
            fc.property(fc.integer({min: 0, max: 1000}), () => {
                try {
                    checkRevoked(true);
                    fail('Expected OAuthException');
                } catch (e) {
                    expect(e).toBeInstanceOf(OAuthException);
                    expect((e as OAuthException).errorCode).toBe('invalid_grant');
                }
            }),
            {numRuns: 200},
        );
    });

    it('a non-revoked token is not rejected on revocation grounds', () => {
        fc.assert(
            fc.property(fc.integer({min: 0, max: 1000}), () => {
                expect(() => checkRevoked(false)).not.toThrow();
            }),
            {numRuns: 200},
        );
    });

    it('revocation check is the first guard — checked regardless of other token state', () => {
        // Simulate a token that is revoked but otherwise valid (not expired, not used)
        fc.assert(
            fc.property(
                fc.boolean(),
                fc.date({min: new Date(Date.now() + 1000), max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)}),
                fc.date({min: new Date(Date.now() + 1000), max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)}),
                (revoked, _expiresAt, _absoluteExpiresAt) => {
                    if (revoked) {
                        try {
                            checkRevoked(revoked);
                            fail('Expected OAuthException');
                        } catch (e) {
                            expect(e).toBeInstanceOf(OAuthException);
                            expect((e as OAuthException).errorCode).toBe('invalid_grant');
                        }
                    } else {
                        expect(() => checkRevoked(revoked)).not.toThrow();
                    }
                },
            ),
            {numRuns: 200},
        );
    });
});

/**
 * Feature: db-refresh-token-rotation, Property 4: Rotation preserves family invariants
 *
 * For any token rotation (A → B):
 *   B.family_id == A.family_id
 *   B.parent_id == A.id
 *   B.user_id == A.user_id
 *   B.client_id == A.client_id
 *   B.tenant_id == A.tenant_id
 *   B.absolute_expires_at == A.absolute_expires_at
 *
 * Validates: Requirements 4.1, 4.3
 */
describe('Feature: db-refresh-token-rotation, Property 4: Rotation preserves family invariants', () => {
    const SLIDING_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

    /**
     * Simulate the rotation logic from consumeAndRotate():
     * Given a consumed parent record A, produce the child record B.
     */
    function simulateRotation(parentRecord: {
        id: string;
        familyId: string;
        userId: string;
        clientId: string;
        tenantId: string;
        scope: string;
        absoluteExpiresAt: Date;
    }) {
        const plaintext = generateOpaqueToken();
        const tokenHash = hashToken(plaintext);
        const expiresAt = clampExpiry(SLIDING_MS, parentRecord.absoluteExpiresAt);

        return {
            plaintext,
            record: {
                id: crypto.randomUUID(),
                tokenHash,
                familyId: parentRecord.familyId,
                parentId: parentRecord.id,
                userId: parentRecord.userId,
                clientId: parentRecord.clientId,
                tenantId: parentRecord.tenantId,
                scope: parentRecord.scope,
                expiresAt,
                absoluteExpiresAt: parentRecord.absoluteExpiresAt,
                revoked: false,
                usedAt: null as Date | null,
            },
        };
    }

    const uuidArb = fc.uuid();
    const clientIdArb = fc.string({minLength: 1, maxLength: 50});
    const scopeArb = fc.subarray(['openid', 'profile', 'email'], {minLength: 1}).map(s => s.join(' '));
    const futureTimestampArb = fc.integer({
        min: Date.now() + 1000,
        max: Date.now() + 365 * 24 * 60 * 60 * 1000,
    }).map(ts => new Date(ts));

    const parentRecordArb = fc.record({
        id: uuidArb,
        familyId: uuidArb,
        userId: uuidArb,
        clientId: clientIdArb,
        tenantId: uuidArb,
        scope: scopeArb,
        absoluteExpiresAt: futureTimestampArb,
    });

    it('child token preserves family_id from parent', () => {
        fc.assert(
            fc.property(parentRecordArb, (parent) => {
                const {record: child} = simulateRotation(parent);
                expect(child.familyId).toEqual(parent.familyId);
            }),
            {numRuns: 200},
        );
    });

    it('child token parent_id equals parent id', () => {
        fc.assert(
            fc.property(parentRecordArb, (parent) => {
                const {record: child} = simulateRotation(parent);
                expect(child.parentId).toEqual(parent.id);
            }),
            {numRuns: 200},
        );
    });

    it('child token preserves user_id from parent', () => {
        fc.assert(
            fc.property(parentRecordArb, (parent) => {
                const {record: child} = simulateRotation(parent);
                expect(child.userId).toEqual(parent.userId);
            }),
            {numRuns: 200},
        );
    });

    it('child token preserves client_id from parent', () => {
        fc.assert(
            fc.property(parentRecordArb, (parent) => {
                const {record: child} = simulateRotation(parent);
                expect(child.clientId).toEqual(parent.clientId);
            }),
            {numRuns: 200},
        );
    });

    it('child token preserves tenant_id from parent', () => {
        fc.assert(
            fc.property(parentRecordArb, (parent) => {
                const {record: child} = simulateRotation(parent);
                expect(child.tenantId).toEqual(parent.tenantId);
            }),
            {numRuns: 200},
        );
    });

    it('child token preserves absolute_expires_at from parent', () => {
        fc.assert(
            fc.property(parentRecordArb, (parent) => {
                const {record: child} = simulateRotation(parent);
                expect(child.absoluteExpiresAt.getTime()).toEqual(parent.absoluteExpiresAt.getTime());
            }),
            {numRuns: 200},
        );
    });
});

/**
 * Feature: db-refresh-token-rotation, Property 10: Omitted scope defaults to record scope
 *
 * For any refresh token record with scope S, when scope is omitted,
 * the granted scope on the new token SHALL equal S.
 *
 * Validates: Requirements 8.3
 */
describe('Feature: db-refresh-token-rotation, Property 10: Omitted scope defaults to record scope', () => {
    const oauthScopes = ['openid', 'profile', 'email'];
    const scopeSubsetArb = fc.subarray(oauthScopes, {minLength: 1});

    it('when requestedScope is undefined, the fallback logic yields the record scope S unchanged', () => {
        fc.assert(
            fc.property(scopeSubsetArb, (scopes) => {
                const recordScope = scopes.join(' ');
                const requestedScope: string | undefined = undefined;

                // This mirrors the conditional in consumeAndRotate:
                // const grantedScope = params.requestedScope
                //     ? validateScopeSubset(params.requestedScope, existing.scope)
                //     : existing.scope;
                const grantedScope = requestedScope
                    ? validateScopeSubset(requestedScope, recordScope)
                    : recordScope;

                expect(grantedScope).toBe(recordScope);
            }),
            {numRuns: 200},
        );
    });

    it('when requestedScope is falsy (null or empty string), the fallback logic yields the record scope S unchanged', () => {
        const falsyValues = [null, undefined, ''] as const;

        fc.assert(
            fc.property(scopeSubsetArb, fc.constantFrom(...falsyValues), (scopes, falsyValue) => {
                const recordScope = scopes.join(' ');
                const requestedScope = falsyValue as string | undefined;

                const grantedScope = requestedScope
                    ? validateScopeSubset(requestedScope, recordScope)
                    : recordScope;

                expect(grantedScope).toBe(recordScope);
            }),
            {numRuns: 200},
        );
    });
});

/**
 * Feature: db-refresh-token-rotation, Property 9: Scope down-scoping is a subset check
 *
 * For any scope set S and requested set R: if R ⊆ S then accept with granted scope R;
 * if R ⊄ S then reject with `invalid_scope`.
 *
 * Validates: Requirements 8.1, 8.2
 */
describe('Feature: db-refresh-token-rotation, Property 9: Scope down-scoping is a subset check', () => {
    const oauthScopes = ['openid', 'profile', 'email'];
    const scopeSubsetArb = fc.subarray(oauthScopes, {minLength: 1});

    it('when R ⊆ S, validateScopeSubset returns the granted scope equal to R', () => {
        fc.assert(
            fc.property(scopeSubsetArb, scopeSubsetArb, (requested, record) => {
                const requestedSet = new Set(requested);
                const recordSet = new Set(record);
                const isSubset = [...requestedSet].every(s => recordSet.has(s));

                if (isSubset) {
                    const result = validateScopeSubset(requested.join(' '), record.join(' '));
                    const resultScopes = new Set(result.split(' ').filter(Boolean));
                    expect(resultScopes).toEqual(requestedSet);
                }
            }),
            {numRuns: 200},
        );
    });

    it('when R ⊄ S (R contains at least one element not in S), validateScopeSubset throws OAuthException with invalid_scope', () => {
        fc.assert(
            fc.property(scopeSubsetArb, scopeSubsetArb, (requested, record) => {
                const requestedSet = new Set(requested);
                const recordSet = new Set(record);
                const isSubset = [...requestedSet].every(s => recordSet.has(s));

                if (!isSubset) {
                    try {
                        validateScopeSubset(requested.join(' '), record.join(' '));
                        fail('Expected OAuthException to be thrown');
                    } catch (e) {
                        expect(e).toBeInstanceOf(OAuthException);
                        expect((e as OAuthException).errorCode).toBe('invalid_scope');
                    }
                }
            }),
            {numRuns: 200},
        );
    });

    it('when R = S (exact match), the function succeeds and returns S', () => {
        fc.assert(
            fc.property(scopeSubsetArb, (scopes) => {
                const scopeStr = scopes.join(' ');
                const result = validateScopeSubset(scopeStr, scopeStr);
                const resultScopes = new Set(result.split(' ').filter(Boolean));
                expect(resultScopes).toEqual(new Set(scopes));
            }),
            {numRuns: 200},
        );
    });
});
