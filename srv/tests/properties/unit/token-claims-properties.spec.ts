import * as fc from 'fast-check';
import {GRANT_TYPES, TechnicalToken, TenantToken} from '../../../src/casl/contexts';
import {RoleEnum} from '../../../src/entity/roleEnum';

/**
 * Feature: access-token-claims-compliance, Property 1: All required claims present
 *
 * For any valid token issuance (any grant type, any user, any tenant, any scope
 * combination), the decoded JWT payload SHALL contain all of: `iss`, `sub`, `aud`,
 * `exp`, `iat`, `nbf`, `jti`, `scope`, `client_id`, `tenant_id`, `grant_type`.
 *
 * Note: `iss`, `exp`, `iat` are set by the signing layer (JwtSignOptions), not by
 * asPlainObject(). This test verifies the payload builder emits all claims that it
 * is responsible for: `sub`, `aud`, `nbf`, `jti`, `scope`, `client_id`, `tenant_id`,
 * `grant_type`. The signing layer adds `iss`, `iat`, `exp`.
 *
 * **Validates: Requirements 1.1**
 */
describe('Property 1: All required claims present', () => {
    const VALID_OIDC_SCOPES = ['openid', 'profile', 'email'];
    const VALID_ROLES = [RoleEnum.SUPER_ADMIN, RoleEnum.TENANT_ADMIN, RoleEnum.TENANT_VIEWER];
    const TENANT_GRANT_TYPES = [GRANT_TYPES.PASSWORD, GRANT_TYPES.CODE, GRANT_TYPES.REFRESH_TOKEN];

    const uuidArb = fc.uuid();
    const emailArb = fc.emailAddress();
    const nameArb = fc.string({minLength: 1, maxLength: 50});
    const domainArb = fc.domain();
    const scopesArb = fc.subarray(VALID_OIDC_SCOPES, {minLength: 0});
    const rolesArb = fc.subarray(VALID_ROLES, {minLength: 0});
    const tenantGrantTypeArb = fc.constantFrom(...TENANT_GRANT_TYPES);

    // Claims the payload builder is responsible for
    const PAYLOAD_BUILDER_CLAIMS = [
        'sub', 'aud', 'nbf', 'jti', 'scope', 'client_id', 'tenant_id', 'grant_type',
    ];

    describe('TenantToken', () => {
        it('asPlainObject() contains all payload-builder claims for any input', () => {
            fc.assert(
                fc.property(
                    uuidArb, uuidArb, nameArb, domainArb, uuidArb,
                    scopesArb, rolesArb, tenantGrantTypeArb,
                    (userId, tenantId, tenantName, tenantDomain, clientId, scopes, roles, grantType) => {
                        const token = TenantToken.create({
                            sub: userId,
                            tenant: {id: tenantId, name: tenantName, domain: tenantDomain},
                            roles,
                            grant_type: grantType,
                            aud: ['https://auth.example.com'],
                            jti: crypto.randomUUID(),
                            nbf: Math.floor(Date.now() / 1000),
                            scope: scopes.join(' '),
                            client_id: clientId,
                            tenant_id: tenantId,
                        });

                        const payload = token.asPlainObject();
                        for (const claim of PAYLOAD_BUILDER_CLAIMS) {
                            expect(payload).toHaveProperty(claim);
                        }
                    },
                ),
                {numRuns: 100},
            );
        });
    });

    describe('TechnicalToken', () => {
        it('asPlainObject() contains all payload-builder claims for any input', () => {
            fc.assert(
                fc.property(
                    uuidArb, nameArb, domainArb, uuidArb, scopesArb,
                    (tenantId, tenantName, tenantDomain, clientId, scopes) => {
                        const token = TechnicalToken.create({
                            sub: 'oauth',
                            tenant: {id: tenantId, name: tenantName, domain: tenantDomain},
                            scope: scopes.join(' '),
                            aud: ['https://auth.example.com'],
                            jti: crypto.randomUUID(),
                            nbf: Math.floor(Date.now() / 1000),
                            client_id: clientId,
                            tenant_id: tenantId,
                        });

                        const payload = token.asPlainObject();
                        for (const claim of PAYLOAD_BUILDER_CLAIMS) {
                            expect(payload).toHaveProperty(claim);
                        }
                    },
                ),
                {numRuns: 100},
            );
        });
    });
});

/**
 * Feature: access-token-claims-compliance, Property 2: Time claims consistency
 *
 * For any issued access token, `nbf` SHALL be an integer Unix timestamp
 * (seconds since epoch).
 *
 * Note: `iat` and `exp` are set by the signing layer (JwtSignOptions), not by
 * asPlainObject(). This test verifies only `nbf` which is set by the payload builder.
 *
 * **Validates: Requirements 1.3, 1.4, 1.5**
 */
describe('Property 2: Time claims consistency', () => {
    const VALID_OIDC_SCOPES = ['openid', 'profile', 'email'];
    const VALID_ROLES = [RoleEnum.SUPER_ADMIN, RoleEnum.TENANT_ADMIN, RoleEnum.TENANT_VIEWER];
    const TENANT_GRANT_TYPES = [GRANT_TYPES.PASSWORD, GRANT_TYPES.CODE, GRANT_TYPES.REFRESH_TOKEN];

    const uuidArb = fc.uuid();
    const nameArb = fc.string({minLength: 1, maxLength: 50});
    const domainArb = fc.domain();
    const scopesArb = fc.subarray(VALID_OIDC_SCOPES, {minLength: 0});
    const rolesArb = fc.subarray(VALID_ROLES, {minLength: 0});
    const grantTypeArb = fc.constantFrom(...TENANT_GRANT_TYPES);

    // Reasonable Unix timestamp range: 2020-01-01 to 2040-01-01
    const MIN_TIMESTAMP = 1577836800;
    const MAX_TIMESTAMP = 2208988800;
    const nbfArb = fc.integer({min: MIN_TIMESTAMP, max: MAX_TIMESTAMP});

    describe('TenantToken', () => {
        it('nbf in asPlainObject() is a number and a reasonable Unix timestamp', () => {
            fc.assert(
                fc.property(
                    uuidArb, uuidArb, nameArb, domainArb, uuidArb,
                    scopesArb, rolesArb, grantTypeArb, nbfArb,
                    (userId, tenantId, tenantName, tenantDomain, clientId, scopes, roles, grantType, nbf) => {
                        const token = TenantToken.create({
                            sub: userId,
                            tenant: {id: tenantId, name: tenantName, domain: tenantDomain},
                            roles,
                            grant_type: grantType,
                            aud: ['https://auth.example.com'],
                            jti: crypto.randomUUID(),
                            nbf,
                            scope: scopes.join(' '),
                            client_id: clientId,
                            tenant_id: tenantId,
                        });

                        const payload = token.asPlainObject();

                        // nbf must be a number
                        expect(typeof payload.nbf).toBe('number');
                        // nbf must be an integer (Unix timestamp in seconds)
                        expect(Number.isInteger(payload.nbf)).toBe(true);
                        // nbf must be a reasonable Unix timestamp
                        expect(payload.nbf).toBeGreaterThanOrEqual(MIN_TIMESTAMP);
                        expect(payload.nbf).toBeLessThanOrEqual(MAX_TIMESTAMP);
                        // nbf must match the value passed at creation
                        expect(payload.nbf).toBe(nbf);
                    },
                ),
                {numRuns: 100},
            );
        });
    });

    describe('TechnicalToken', () => {
        it('nbf in asPlainObject() is a number and a reasonable Unix timestamp', () => {
            fc.assert(
                fc.property(
                    uuidArb, nameArb, domainArb, uuidArb, scopesArb, nbfArb,
                    (tenantId, tenantName, tenantDomain, clientId, scopes, nbf) => {
                        const token = TechnicalToken.create({
                            sub: 'oauth',
                            tenant: {id: tenantId, name: tenantName, domain: tenantDomain},
                            scope: scopes.join(' '),
                            aud: ['https://auth.example.com'],
                            jti: crypto.randomUUID(),
                            nbf,
                            client_id: clientId,
                            tenant_id: tenantId,
                        });

                        const payload = token.asPlainObject();

                        // nbf must be a number
                        expect(typeof payload.nbf).toBe('number');
                        // nbf must be an integer (Unix timestamp in seconds)
                        expect(Number.isInteger(payload.nbf)).toBe(true);
                        // nbf must be a reasonable Unix timestamp
                        expect(payload.nbf).toBeGreaterThanOrEqual(MIN_TIMESTAMP);
                        expect(payload.nbf).toBeLessThanOrEqual(MAX_TIMESTAMP);
                        // nbf must match the value passed at creation
                        expect(payload.nbf).toBe(nbf);
                    },
                ),
                {numRuns: 100},
            );
        });
    });
});

/**
 * Feature: access-token-claims-compliance, Property 3: Scope/role separation
 *
 * For any issued access token, the `scope` claim SHALL contain only valid OIDC
 * scope values (`openid`, `profile`, `email`) and SHALL NOT contain any role
 * enum names (`SUPER_ADMIN`, `TENANT_ADMIN`, `TENANT_VIEWER`).
 *
 * For TenantTokens, the `roles` array SHALL contain only valid role enum names
 * and SHALL NOT contain any OIDC scope values.
 *
 * **Validates: Requirements 1.6, 5.6**
 */
describe('Property 3: Scope/role separation', () => {
    const VALID_OIDC_SCOPES = ['openid', 'profile', 'email'];
    const VALID_ROLES = [RoleEnum.SUPER_ADMIN, RoleEnum.TENANT_ADMIN, RoleEnum.TENANT_VIEWER];
    const TENANT_GRANT_TYPES = [GRANT_TYPES.PASSWORD, GRANT_TYPES.CODE, GRANT_TYPES.REFRESH_TOKEN];

    const uuidArb = fc.uuid();
    const nameArb = fc.string({minLength: 1, maxLength: 50});
    const domainArb = fc.domain();
    const scopesArb = fc.subarray(VALID_OIDC_SCOPES, {minLength: 0});
    const rolesArb = fc.subarray(VALID_ROLES, {minLength: 0});
    const grantTypeArb = fc.constantFrom(...TENANT_GRANT_TYPES);

    describe('TenantToken', () => {
        it('scope contains only OIDC values and no role enum names', () => {
            fc.assert(
                fc.property(
                    uuidArb, uuidArb, nameArb, domainArb, uuidArb,
                    scopesArb, rolesArb, grantTypeArb,
                    (userId, tenantId, tenantName, tenantDomain, clientId, scopes, roles, grantType) => {
                        const token = TenantToken.create({
                            sub: userId,
                            tenant: {id: tenantId, name: tenantName, domain: tenantDomain},
                            roles,
                            grant_type: grantType,
                            aud: ['https://auth.example.com'],
                            jti: crypto.randomUUID(),
                            nbf: Math.floor(Date.now() / 1000),
                            scope: scopes.join(' '),
                            client_id: clientId,
                            tenant_id: tenantId,
                        });

                        const payload = token.asPlainObject();

                        // scope must be a string
                        expect(typeof payload.scope).toBe('string');

                        // Each scope value must be a valid OIDC scope
                        const scopeValues = payload.scope.length > 0
                            ? payload.scope.split(' ')
                            : [];
                        for (const s of scopeValues) {
                            expect(VALID_OIDC_SCOPES).toContain(s);
                        }

                        // scope must NOT contain any role enum names
                        for (const role of VALID_ROLES) {
                            expect(payload.scope).not.toContain(role);
                        }
                    },
                ),
                {numRuns: 100},
            );
        });

        it('roles contains only valid role enum names and no OIDC scope values', () => {
            fc.assert(
                fc.property(
                    uuidArb, uuidArb, nameArb, domainArb, uuidArb,
                    scopesArb, rolesArb, grantTypeArb,
                    (userId, tenantId, tenantName, tenantDomain, clientId, scopes, roles, grantType) => {
                        const token = TenantToken.create({
                            sub: userId,
                            tenant: {id: tenantId, name: tenantName, domain: tenantDomain},
                            roles,
                            grant_type: grantType,
                            aud: ['https://auth.example.com'],
                            jti: crypto.randomUUID(),
                            nbf: Math.floor(Date.now() / 1000),
                            scope: scopes.join(' '),
                            client_id: clientId,
                            tenant_id: tenantId,
                        });

                        const payload = token.asPlainObject();

                        // roles must be an array
                        expect(Array.isArray(payload.roles)).toBe(true);

                        // Each role must be a valid role enum name
                        for (const r of payload.roles) {
                            expect(VALID_ROLES).toContain(r);
                        }

                        // roles must NOT contain any OIDC scope values
                        for (const oidcScope of VALID_OIDC_SCOPES) {
                            expect(payload.roles).not.toContain(oidcScope);
                        }
                    },
                ),
                {numRuns: 100},
            );
        });
    });

    describe('TechnicalToken', () => {
        it('scope contains only OIDC values and no role enum names', () => {
            fc.assert(
                fc.property(
                    uuidArb, nameArb, domainArb, uuidArb, scopesArb,
                    (tenantId, tenantName, tenantDomain, clientId, scopes) => {
                        const token = TechnicalToken.create({
                            sub: 'oauth',
                            tenant: {id: tenantId, name: tenantName, domain: tenantDomain},
                            scope: scopes.join(' '),
                            aud: ['https://auth.example.com'],
                            jti: crypto.randomUUID(),
                            nbf: Math.floor(Date.now() / 1000),
                            client_id: clientId,
                            tenant_id: tenantId,
                        });

                        const payload = token.asPlainObject();

                        // scope must be a string
                        expect(typeof payload.scope).toBe('string');

                        // Each scope value must be a valid OIDC scope
                        const scopeValues = payload.scope.length > 0
                            ? payload.scope.split(' ')
                            : [];
                        for (const s of scopeValues) {
                            expect(VALID_OIDC_SCOPES).toContain(s);
                        }

                        // scope must NOT contain any role enum names
                        for (const role of VALID_ROLES) {
                            expect(payload.scope).not.toContain(role);
                        }
                    },
                ),
                {numRuns: 100},
            );
        });
    });
});

/**
 * Feature: access-token-claims-compliance, Property 4: Grant type fidelity
 *
 * For any issued access token, the `grant_type` claim SHALL match the grant
 * type passed at creation.
 *
 * **Validates: Requirements 1.7**
 */
describe('Property 4: Grant type fidelity', () => {
    const VALID_OIDC_SCOPES = ['openid', 'profile', 'email'];
    const VALID_ROLES = [RoleEnum.SUPER_ADMIN, RoleEnum.TENANT_ADMIN, RoleEnum.TENANT_VIEWER];
    const TENANT_GRANT_TYPES = [GRANT_TYPES.PASSWORD, GRANT_TYPES.CODE, GRANT_TYPES.REFRESH_TOKEN];

    const uuidArb = fc.uuid();
    const nameArb = fc.string({minLength: 1, maxLength: 50});
    const domainArb = fc.domain();
    const scopesArb = fc.subarray(VALID_OIDC_SCOPES, {minLength: 0});
    const rolesArb = fc.subarray(VALID_ROLES, {minLength: 0});
    const tenantGrantTypeArb = fc.constantFrom(...TENANT_GRANT_TYPES);

    describe('TenantToken', () => {
        it('grant_type in asPlainObject() matches the grant type passed at creation', () => {
            fc.assert(
                fc.property(
                    uuidArb, uuidArb, nameArb, domainArb, uuidArb,
                    scopesArb, rolesArb, tenantGrantTypeArb,
                    (userId, tenantId, tenantName, tenantDomain, clientId, scopes, roles, grantType) => {
                        const token = TenantToken.create({
                            sub: userId,
                            tenant: {id: tenantId, name: tenantName, domain: tenantDomain},
                            roles,
                            grant_type: grantType,
                            aud: ['https://auth.example.com'],
                            jti: crypto.randomUUID(),
                            nbf: Math.floor(Date.now() / 1000),
                            scope: scopes.join(' '),
                            client_id: clientId,
                            tenant_id: tenantId,
                        });

                        const payload = token.asPlainObject();

                        // grant_type must match exactly what was passed
                        expect(payload.grant_type).toBe(grantType);
                    },
                ),
                {numRuns: 100},
            );
        });
    });

    describe('TechnicalToken', () => {
        it('grant_type in asPlainObject() is always client_credentials', () => {
            fc.assert(
                fc.property(
                    uuidArb, nameArb, domainArb, uuidArb, scopesArb,
                    (tenantId, tenantName, tenantDomain, clientId, scopes) => {
                        const token = TechnicalToken.create({
                            sub: 'oauth',
                            tenant: {id: tenantId, name: tenantName, domain: tenantDomain},
                            scope: scopes.join(' '),
                            aud: ['https://auth.example.com'],
                            jti: crypto.randomUUID(),
                            nbf: Math.floor(Date.now() / 1000),
                            client_id: clientId,
                            tenant_id: tenantId,
                        });

                        const payload = token.asPlainObject();

                        // TechnicalToken grant_type is always client_credentials
                        expect(payload.grant_type).toBe(GRANT_TYPES.CLIENT_CREDENTIALS);
                    },
                ),
                {numRuns: 100},
            );
        });
    });
});

/**
 * Feature: access-token-claims-compliance, Property 5: Immutable subject identifier
 *
 * For any TenantToken access token issued for any user, the `sub` claim SHALL
 * equal the user's immutable UUID and SHALL NOT be an email address.
 *
 * **Validates: Requirements 2.1, 2.3**
 */
describe('Property 5: Immutable subject identifier', () => {
    const VALID_OIDC_SCOPES = ['openid', 'profile', 'email'];
    const VALID_ROLES = [RoleEnum.SUPER_ADMIN, RoleEnum.TENANT_ADMIN, RoleEnum.TENANT_VIEWER];
    const TENANT_GRANT_TYPES = [GRANT_TYPES.PASSWORD, GRANT_TYPES.CODE, GRANT_TYPES.REFRESH_TOKEN];

    const uuidArb = fc.uuid();
    const nameArb = fc.string({minLength: 1, maxLength: 50});
    const domainArb = fc.domain();
    const scopesArb = fc.subarray(VALID_OIDC_SCOPES, {minLength: 0});
    const rolesArb = fc.subarray(VALID_ROLES, {minLength: 0});
    const grantTypeArb = fc.constantFrom(...TENANT_GRANT_TYPES);

    // RFC 5322 email pattern — simple check for @ sign
    const EMAIL_REGEX = /@/;
    // UUID v4 pattern
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    it('sub equals the user UUID passed at creation', () => {
        fc.assert(
            fc.property(
                uuidArb, uuidArb, nameArb, domainArb, uuidArb,
                scopesArb, rolesArb, grantTypeArb,
                (userId, tenantId, tenantName, tenantDomain, clientId, scopes, roles, grantType) => {
                    const token = TenantToken.create({
                        sub: userId,
                        tenant: {id: tenantId, name: tenantName, domain: tenantDomain},
                        roles,
                        grant_type: grantType,
                        aud: ['https://auth.example.com'],
                        jti: crypto.randomUUID(),
                        nbf: Math.floor(Date.now() / 1000),
                        scope: scopes.join(' '),
                        client_id: clientId,
                        tenant_id: tenantId,
                    });

                    const payload = token.asPlainObject();

                    // sub must equal the user UUID we passed in
                    expect(payload.sub).toBe(userId);
                },
            ),
            {numRuns: 100},
        );
    });

    it('sub is a valid UUID, not an email address', () => {
        fc.assert(
            fc.property(
                uuidArb, uuidArb, nameArb, domainArb, uuidArb,
                scopesArb, rolesArb, grantTypeArb,
                (userId, tenantId, tenantName, tenantDomain, clientId, scopes, roles, grantType) => {
                    const token = TenantToken.create({
                        sub: userId,
                        tenant: {id: tenantId, name: tenantName, domain: tenantDomain},
                        roles,
                        grant_type: grantType,
                        aud: ['https://auth.example.com'],
                        jti: crypto.randomUUID(),
                        nbf: Math.floor(Date.now() / 1000),
                        scope: scopes.join(' '),
                        client_id: clientId,
                        tenant_id: tenantId,
                    });

                    const payload = token.asPlainObject();

                    // sub must match UUID format
                    expect(payload.sub).toMatch(UUID_REGEX);
                    // sub must NOT be an email address
                    expect(payload.sub).not.toMatch(EMAIL_REGEX);
                },
            ),
            {numRuns: 100},
        );
    });
});

/**
 * Feature: access-token-claims-compliance, Property 6: Audience is always an array
 *
 * For any issued access token, the `aud` claim SHALL be a JSON array and
 * SHALL NOT be a bare string.
 *
 * **Validates: Requirements 3.1, 3.2**
 */
describe('Property 6: Audience is always an array', () => {
    const VALID_OIDC_SCOPES = ['openid', 'profile', 'email'];
    const VALID_ROLES = [RoleEnum.SUPER_ADMIN, RoleEnum.TENANT_ADMIN, RoleEnum.TENANT_VIEWER];
    const TENANT_GRANT_TYPES = [GRANT_TYPES.PASSWORD, GRANT_TYPES.CODE, GRANT_TYPES.REFRESH_TOKEN];

    const uuidArb = fc.uuid();
    const nameArb = fc.string({minLength: 1, maxLength: 50});
    const domainArb = fc.domain();
    const scopesArb = fc.subarray(VALID_OIDC_SCOPES, {minLength: 0});
    const rolesArb = fc.subarray(VALID_ROLES, {minLength: 0});
    const grantTypeArb = fc.constantFrom(...TENANT_GRANT_TYPES);

    // Generate random audience arrays (1-3 audience values)
    const audArb = fc.array(fc.webUrl(), {minLength: 1, maxLength: 3});

    describe('TenantToken', () => {
        it('aud is always an array in the payload', () => {
            fc.assert(
                fc.property(
                    uuidArb, uuidArb, nameArb, domainArb, uuidArb,
                    scopesArb, rolesArb, grantTypeArb, audArb,
                    (userId, tenantId, tenantName, tenantDomain, clientId, scopes, roles, grantType, aud) => {
                        const token = TenantToken.create({
                            sub: userId,
                            tenant: {id: tenantId, name: tenantName, domain: tenantDomain},
                            roles,
                            grant_type: grantType,
                            aud,
                            jti: crypto.randomUUID(),
                            nbf: Math.floor(Date.now() / 1000),
                            scope: scopes.join(' '),
                            client_id: clientId,
                            tenant_id: tenantId,
                        });

                        const payload = token.asPlainObject();

                        expect(Array.isArray(payload.aud)).toBe(true);
                        expect(typeof payload.aud).not.toBe('string');
                    },
                ),
                {numRuns: 100},
            );
        });
    });

    describe('TechnicalToken', () => {
        it('aud is always an array in the payload', () => {
            fc.assert(
                fc.property(
                    uuidArb, nameArb, domainArb, uuidArb, scopesArb, audArb,
                    (tenantId, tenantName, tenantDomain, clientId, scopes, aud) => {
                        const token = TechnicalToken.create({
                            sub: 'oauth',
                            tenant: {id: tenantId, name: tenantName, domain: tenantDomain},
                            scope: scopes.join(' '),
                            aud,
                            jti: crypto.randomUUID(),
                            nbf: Math.floor(Date.now() / 1000),
                            client_id: clientId,
                            tenant_id: tenantId,
                        });

                        const payload = token.asPlainObject();

                        expect(Array.isArray(payload.aud)).toBe(true);
                        expect(typeof payload.aud).not.toBe('string');
                    },
                ),
                {numRuns: 100},
            );
        });
    });
});

/**
 * Feature: access-token-claims-compliance, Property 7: Globally unique token identifier
 *
 * For any set of issued access tokens, every `jti` value SHALL be unique, and
 * each `jti` SHALL conform to UUID v4 format.
 *
 * **Validates: Requirements 4.1, 4.2, 4.3**
 */
describe('Property 7: Globally unique token identifier', () => {
    const VALID_OIDC_SCOPES = ['openid', 'profile', 'email'];
    const VALID_ROLES = [RoleEnum.SUPER_ADMIN, RoleEnum.TENANT_ADMIN, RoleEnum.TENANT_VIEWER];
    const TENANT_GRANT_TYPES = [GRANT_TYPES.PASSWORD, GRANT_TYPES.CODE, GRANT_TYPES.REFRESH_TOKEN];

    const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    const uuidArb = fc.uuid();
    const nameArb = fc.string({minLength: 1, maxLength: 50});
    const domainArb = fc.domain();
    const scopesArb = fc.subarray(VALID_OIDC_SCOPES, {minLength: 0});
    const rolesArb = fc.subarray(VALID_ROLES, {minLength: 0});
    const grantTypeArb = fc.constantFrom(...TENANT_GRANT_TYPES);

    it('each jti conforms to UUID v4 format (TenantToken)', () => {
        fc.assert(
            fc.property(
                uuidArb, uuidArb, nameArb, domainArb, uuidArb,
                scopesArb, rolesArb, grantTypeArb,
                (userId, tenantId, tenantName, tenantDomain, clientId, scopes, roles, grantType) => {
                    const jti = crypto.randomUUID();
                    const token = TenantToken.create({
                        sub: userId,
                        tenant: {id: tenantId, name: tenantName, domain: tenantDomain},
                        roles,
                        grant_type: grantType,
                        aud: ['https://auth.example.com'],
                        jti,
                        nbf: Math.floor(Date.now() / 1000),
                        scope: scopes.join(' '),
                        client_id: clientId,
                        tenant_id: tenantId,
                    });

                    const payload = token.asPlainObject();
                    expect(payload.jti).toMatch(UUID_V4_REGEX);
                },
            ),
            {numRuns: 100},
        );
    });

    it('each jti conforms to UUID v4 format (TechnicalToken)', () => {
        fc.assert(
            fc.property(
                uuidArb, nameArb, domainArb, uuidArb, scopesArb,
                (tenantId, tenantName, tenantDomain, clientId, scopes) => {
                    const jti = crypto.randomUUID();
                    const token = TechnicalToken.create({
                        sub: 'oauth',
                        tenant: {id: tenantId, name: tenantName, domain: tenantDomain},
                        scope: scopes.join(' '),
                        aud: ['https://auth.example.com'],
                        jti,
                        nbf: Math.floor(Date.now() / 1000),
                        client_id: clientId,
                        tenant_id: tenantId,
                    });

                    const payload = token.asPlainObject();
                    expect(payload.jti).toMatch(UUID_V4_REGEX);
                },
            ),
            {numRuns: 100},
        );
    });

    it('all jti values are unique across a batch of tokens', () => {
        fc.assert(
            fc.property(
                fc.integer({min: 10, max: 50}),
                (batchSize) => {
                    const jtis = new Set<string>();

                    for (let i = 0; i < batchSize; i++) {
                        const jti = crypto.randomUUID();
                        const token = TenantToken.create({
                            sub: crypto.randomUUID(),
                            tenant: {id: crypto.randomUUID(), name: 'Tenant', domain: 'test.local'},
                            roles: [],
                            grant_type: GRANT_TYPES.PASSWORD,
                            aud: ['https://auth.example.com'],
                            jti,
                            nbf: Math.floor(Date.now() / 1000),
                            scope: 'openid',
                            client_id: crypto.randomUUID(),
                            tenant_id: crypto.randomUUID(),
                        });

                        const payload = token.asPlainObject();
                        jtis.add(payload.jti);
                    }

                    // Every jti must be unique
                    expect(jtis.size).toBe(batchSize);
                },
            ),
            {numRuns: 100},
        );
    });
});

/**
 * Feature: access-token-claims-compliance, Property 8: Profile data exclusion
 *
 * For any issued access token, the decoded JWT payload SHALL NOT contain
 * `email`, `name`, `userId`, or `userTenant`.
 *
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
 */
describe('Property 8: Profile data exclusion', () => {
    const VALID_OIDC_SCOPES = ['openid', 'profile', 'email'];
    const VALID_ROLES = [RoleEnum.SUPER_ADMIN, RoleEnum.TENANT_ADMIN, RoleEnum.TENANT_VIEWER];
    const TENANT_GRANT_TYPES = [GRANT_TYPES.PASSWORD, GRANT_TYPES.CODE, GRANT_TYPES.REFRESH_TOKEN];

    const EXCLUDED_FIELDS = ['email', 'name', 'userId', 'userTenant'];

    const uuidArb = fc.uuid();
    const nameArb = fc.string({minLength: 1, maxLength: 50});
    const domainArb = fc.domain();
    const scopesArb = fc.subarray(VALID_OIDC_SCOPES, {minLength: 0});
    const rolesArb = fc.subarray(VALID_ROLES, {minLength: 0});
    const grantTypeArb = fc.constantFrom(...TENANT_GRANT_TYPES);

    describe('TenantToken', () => {
        it('asPlainObject() does not contain email, name, userId, or userTenant', () => {
            fc.assert(
                fc.property(
                    uuidArb, uuidArb, nameArb, domainArb, uuidArb,
                    scopesArb, rolesArb, grantTypeArb,
                    (userId, tenantId, tenantName, tenantDomain, clientId, scopes, roles, grantType) => {
                        const token = TenantToken.create({
                            sub: userId,
                            tenant: {id: tenantId, name: tenantName, domain: tenantDomain},
                            roles,
                            grant_type: grantType,
                            aud: ['https://auth.example.com'],
                            jti: crypto.randomUUID(),
                            nbf: Math.floor(Date.now() / 1000),
                            scope: scopes.join(' '),
                            client_id: clientId,
                            tenant_id: tenantId,
                        });

                        const payload = token.asPlainObject();
                        for (const field of EXCLUDED_FIELDS) {
                            expect(payload).not.toHaveProperty(field);
                        }
                    },
                ),
                {numRuns: 100},
            );
        });
    });

    describe('TechnicalToken', () => {
        it('asPlainObject() does not contain email, name, userId, or userTenant', () => {
            fc.assert(
                fc.property(
                    uuidArb, nameArb, domainArb, uuidArb, scopesArb,
                    (tenantId, tenantName, tenantDomain, clientId, scopes) => {
                        const token = TechnicalToken.create({
                            sub: 'oauth',
                            tenant: {id: tenantId, name: tenantName, domain: tenantDomain},
                            scope: scopes.join(' '),
                            aud: ['https://auth.example.com'],
                            jti: crypto.randomUUID(),
                            nbf: Math.floor(Date.now() / 1000),
                            client_id: clientId,
                            tenant_id: tenantId,
                        });

                        const payload = token.asPlainObject();
                        for (const field of EXCLUDED_FIELDS) {
                            expect(payload).not.toHaveProperty(field);
                        }
                    },
                ),
                {numRuns: 100},
            );
        });
    });
});

/**
 * Feature: access-token-claims-compliance, Property 9: Tenant object retained
 *
 * For any issued access token, the payload SHALL contain a `tenant` object with
 * `id` (valid UUID), `name` (non-empty string), and `domain` (non-empty string).
 *
 * **Validates: Requirements 5.5**
 */
describe('Property 9: Tenant object retained', () => {
    const VALID_OIDC_SCOPES = ['openid', 'profile', 'email'];
    const VALID_ROLES = [RoleEnum.SUPER_ADMIN, RoleEnum.TENANT_ADMIN, RoleEnum.TENANT_VIEWER];
    const TENANT_GRANT_TYPES = [GRANT_TYPES.PASSWORD, GRANT_TYPES.CODE, GRANT_TYPES.REFRESH_TOKEN];

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    const uuidArb = fc.uuid();
    const nameArb = fc.string({minLength: 1, maxLength: 50});
    const domainArb = fc.domain();
    const scopesArb = fc.subarray(VALID_OIDC_SCOPES, {minLength: 0});
    const rolesArb = fc.subarray(VALID_ROLES, {minLength: 0});
    const grantTypeArb = fc.constantFrom(...TENANT_GRANT_TYPES);

    describe('TenantToken', () => {
        it('asPlainObject() contains tenant with id (UUID), name (non-empty), and domain (non-empty)', () => {
            fc.assert(
                fc.property(
                    uuidArb, uuidArb, nameArb, domainArb, uuidArb,
                    scopesArb, rolesArb, grantTypeArb,
                    (userId, tenantId, tenantName, tenantDomain, clientId, scopes, roles, grantType) => {
                        const token = TenantToken.create({
                            sub: userId,
                            tenant: {id: tenantId, name: tenantName, domain: tenantDomain},
                            roles,
                            grant_type: grantType,
                            aud: ['https://auth.example.com'],
                            jti: crypto.randomUUID(),
                            nbf: Math.floor(Date.now() / 1000),
                            scope: scopes.join(' '),
                            client_id: clientId,
                            tenant_id: tenantId,
                        });

                        const payload = token.asPlainObject();

                        // tenant must be present
                        expect(payload).toHaveProperty('tenant');
                        expect(typeof payload.tenant).toBe('object');
                        expect(payload.tenant).not.toBeNull();

                        // tenant.id must be a valid UUID
                        expect(payload.tenant.id).toMatch(UUID_REGEX);

                        // tenant.name must be a non-empty string
                        expect(typeof payload.tenant.name).toBe('string');
                        expect(payload.tenant.name.length).toBeGreaterThan(0);

                        // tenant.domain must be a non-empty string
                        expect(typeof payload.tenant.domain).toBe('string');
                        expect(payload.tenant.domain.length).toBeGreaterThan(0);

                        // Values must match what was passed at creation
                        expect(payload.tenant.id).toBe(tenantId);
                        expect(payload.tenant.name).toBe(tenantName);
                        expect(payload.tenant.domain).toBe(tenantDomain);
                    },
                ),
                {numRuns: 100},
            );
        });
    });

    describe('TechnicalToken', () => {
        it('asPlainObject() contains tenant with id (UUID), name (non-empty), and domain (non-empty)', () => {
            fc.assert(
                fc.property(
                    uuidArb, nameArb, domainArb, uuidArb, scopesArb,
                    (tenantId, tenantName, tenantDomain, clientId, scopes) => {
                        const token = TechnicalToken.create({
                            sub: 'oauth',
                            tenant: {id: tenantId, name: tenantName, domain: tenantDomain},
                            scope: scopes.join(' '),
                            aud: ['https://auth.example.com'],
                            jti: crypto.randomUUID(),
                            nbf: Math.floor(Date.now() / 1000),
                            client_id: clientId,
                            tenant_id: tenantId,
                        });

                        const payload = token.asPlainObject();

                        // tenant must be present
                        expect(payload).toHaveProperty('tenant');
                        expect(typeof payload.tenant).toBe('object');
                        expect(payload.tenant).not.toBeNull();

                        // tenant.id must be a valid UUID
                        expect(payload.tenant.id).toMatch(UUID_REGEX);

                        // tenant.name must be a non-empty string
                        expect(typeof payload.tenant.name).toBe('string');
                        expect(payload.tenant.name.length).toBeGreaterThan(0);

                        // tenant.domain must be a non-empty string
                        expect(typeof payload.tenant.domain).toBe('string');
                        expect(payload.tenant.domain.length).toBeGreaterThan(0);

                        // Values must match what was passed at creation
                        expect(payload.tenant.id).toBe(tenantId);
                        expect(payload.tenant.name).toBe(tenantName);
                        expect(payload.tenant.domain).toBe(tenantDomain);
                    },
                ),
                {numRuns: 100},
            );
        });
    });
});
