import {BadRequestException, ForbiddenException, Injectable, InternalServerErrorException} from "@nestjs/common";
import {AuthService} from "./auth.service";
import {TenantService} from "../services/tenant.service";
import {SubscriptionService} from "../services/subscription.service";
import {SecurityService} from "../casl/security.service";
import {Environment} from "../config/environment.service";
import {AuthCodeService} from "./auth-code.service";
import {User} from "../entity/user.entity";
import {Tenant} from "../entity/tenant.entity";
import {GRANT_TYPES} from "../casl/contexts";
import {Permission} from "../auth/auth.decorator";
import {ClientService} from "../services/client.service";
import {ScopeNormalizer} from "../casl/scope-normalizer";
import {IdTokenService} from "./id-token.service";
import {RefreshTokenService} from "./refresh-token.service";
import {UsersService} from "../services/users.service";
import {OAuthException} from "../exceptions/oauth-exception";
import {SecurityEventLogger} from "../security/security-event-logger.service";
import {Client} from "../entity/client.entity";
import {TokenClaimsService} from "./token-claims.service";

/**
 * Decision result for refresh token eligibility.
 * Used to determine whether a refresh token should be issued and why.
 * Requirements: 1.1, 1.2, 1.3, 2.1, 2.2
 */
interface RefreshTokenDecision {
    eligible: boolean;
    reason: 'offline_access_scope' | 'client_allow_refresh_token' | 'refresh_token_not_eligible';
}

/**
 * TokenIssuanceService — Central orchestrator for OAuth 2.0 / OIDC token issuance.
 *
 * This service coordinates the full token issuance pipeline for all grant types:
 * - Authorization Code (via issueToken with authCode)
 * - Resource Owner Password Credentials (via issueToken)
 * - Refresh Token (via refreshToken)
 * - Client Credentials (via issueClientCredentialsToken)
 *
 * Delegates claim assembly, scope resolution, role formatting, audience construction,
 * session resolution, and refresh token decisions to TokenClaimsService.
 *
 * ## Token Types Produced
 *
 * - **TenantToken** (user grants): Contains both `scopes` (OIDC values) and `roles`
 *   (role enums). Used for authorization_code, password, and refresh_token grants.
 *
 * - **TechnicalToken** (client_credentials): Contains only `scopes`, no `roles` field
 *   since there is no user identity. Per RFC 6749 §4.4.3, never includes refresh_token.
 *
 * ## Response Format
 *
 * All methods return a TokenResponse conforming to OAuth 2.0 (RFC 6749):
 * - access_token: The JWT for API access
 * - token_type: Always "Bearer"
 * - expires_in: Token lifetime in seconds
 * - scope: Space-delimited granted scopes (OIDC values only)
 * - refresh_token: Only for user grants (not client_credentials)
 * - id_token: Only for user grants with 'openid' scope
 *
 * @see TokenClaimsService — delegated claim assembly, scope resolution, role formatting
 * @see AuthService — JWT signing and claims assembly
 * @see IdTokenService — OIDC ID token generation
 * @see RefreshTokenService — refresh token lifecycle management
 */
export interface TokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
    scope: string;
    id_token?: string;
}

export interface IssueTokenOptions {
    subscriberTenantHint?: string;
    authCode?: string;
    nonce?: string;
    requestedScope?: string;
    grant_type?: GRANT_TYPES;
    sid?: string;
    requireAuthTime?: boolean;
    resource?: string;
    /** The OAuth client_id from the authorization request. Used as the ID token audience (aud) claim per OIDC Core §2. */
    oauthClientId?: string;
}

@Injectable()
export class TokenIssuanceService {
    constructor(
        private readonly authService: AuthService,
        private readonly tenantService: TenantService,
        private readonly subscriptionService: SubscriptionService,
        private readonly securityService: SecurityService,
        private readonly configService: Environment,
        private readonly authCodeService: AuthCodeService,
        private readonly clientService: ClientService,
        private readonly idTokenService: IdTokenService,
        private readonly refreshTokenService: RefreshTokenService,
        private readonly usersService: UsersService,
        private readonly securityEventLogger: SecurityEventLogger,
        private readonly claimsService: TokenClaimsService,
    ) {
    }

    /**
     * Given a resolved user and tenant, handles the full pipeline:
     * membership check → subscription resolution → scope building → token creation → response formatting.
     */
    async issueToken(user: User, tenant: Tenant, options?: IssueTokenOptions): Promise<TokenResponse> {
        // this is needed because when you are creating a token you do not have a logged in user yet
        // TODO : but for some scenarios there is logged in user so we can update this 
        const permission = this.securityService.createPermissionForTokenIssuance(tenant.id);

        const isMember = await this.tenantService.isMember(permission, tenant.id, user);
        const isSubscribed = await this.subscriptionService.isUserSubscribedToTenant(permission, user, tenant);

        if (!isMember && !isSubscribed) {
            throw new BadRequestException("User is not a member of the tenant and does not have a valid app subscription");
        }

        // Resolve the Client entity for scope resolution, refresh token binding, and ID token audience.
        // Requirements: 3.1, 3.2, 3.3, 3.4
        const client = await this.resolveClient(tenant, options?.oauthClientId);

        if (isSubscribed) {
            return this.issueSubscribedToken(permission, user, tenant, client, options);
        }

        const roleNames = await this.claimsService.fetchAndFormatRoles(permission, tenant.id, user);

        const grantedScopes = this.claimsService.resolveScopes(
            options?.requestedScope ?? null,
            client,
        );

        // Construct audience with resource indicator if present
        const audience = this.claimsService.buildAudience(options?.resource, this.configService.get("SUPER_TENANT_DOMAIN"));

        const {accessToken, scopes} =
            await this.authService.createUserAccessToken(user, tenant, grantedScopes, roleNames, options?.grant_type ?? GRANT_TYPES.PASSWORD, audience, client.clientId);

        const {authTime, sessionId} = await this.claimsService.resolveUserSession(
            options?.sid,
            options?.grant_type,
            user.id,
            tenant.id,
            options?.requireAuthTime,
        );

        // Determine refresh token eligibility (Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 8.1, 8.2, 8.3)
        const refreshTokenDecision = this.claimsService.shouldIssueRefreshToken(
            scopes,
            client,
            options?.grant_type ?? GRANT_TYPES.PASSWORD,
        );

        // Log the refresh token decision
        this.securityEventLogger.refreshTokenDecision({
            grantType: options?.grant_type ?? GRANT_TYPES.PASSWORD,
            clientId: client.clientId,
            tenantId: tenant.id,
            userId: user.id,
            decision: refreshTokenDecision.eligible ? 'granted' : 'denied',
            reason: refreshTokenDecision.reason,
        });

        // Conditionally create refresh token based on eligibility
        let refreshToken: string | undefined;
        if (refreshTokenDecision.eligible) {
            const {plaintext} = await this.refreshTokenService.create({
                userId: user.id,
                clientId: client.clientId,
                tenantId: tenant.id,
                scope: ScopeNormalizer.format(scopes),
                sid: sessionId,
            });
            refreshToken = plaintext;
        }

        // Read nonce from options (passed by controller from the already-redeemed auth code)
        const nonce = options?.nonce;

        // Use the OAuth client_id from the request for the ID token audience (aud) claim
        // per OIDC Core §2. When the RP identifies itself by alias (e.g. domain), the aud
        // must reflect that value so the RP can validate it. Falls back to the Client entity's
        // internal clientId (UUID) when no oauthClientId was provided. Requirements: 3.3
        const idTokenClientId = options?.oauthClientId ?? client.clientId;
        const idToken = await this.idTokenService.generateIdToken({
            user: {id: user.id, email: user.email, name: user.name, verified: user.verified},
            tenantId: tenant.id,
            clientId: idTokenClientId,
            grantedScopes: scopes,
            accessToken,
            nonce,
            authTime,
            sessionId,
            amr: ["pwd"],
        });

        const response = this.formatResponse(accessToken, refreshToken, scopes, idToken);

        // Log token issuance event (Requirements 3.4)
        this.securityEventLogger.tokenIssued({
            grantType: options?.grant_type ?? GRANT_TYPES.PASSWORD,
            clientId: client.clientId,
            tenantId: tenant.id,
            scope: response.scope,
            userId: user.id,
        });

        return response;
    }

    /**
     * Checks membership/subscription and resolves subscription ambiguity during login.
     * Returns null if access is granted (no ambiguity or direct member).
     * Returns the list of ambiguous tenants if the user needs to pick one.
     */
    async resolveLoginAccess(user: User, tenant: Tenant, subscriberTenantHint?: string): Promise<{
        granted: boolean;
        ambiguousTenants?: any[];
        resolvedHint?: string;
    }> {
        const permission = this.securityService.createPermissionForTokenIssuance(tenant.id);

        const isMember = await this.tenantService.isMember(permission, tenant.id, user);
        const isSubscribed = await this.subscriptionService.isUserSubscribedToTenant(permission, user, tenant);

        if (!isMember && !isSubscribed) {
            throw new ForbiddenException("User is not a member of the tenant and does not have a valid app subscription");
        }

        // Direct member — no ambiguity possible
        if (!isSubscribed) {
            return {granted: true};
        }

        // Subscribed user — check for ambiguity
        const ambiguityResult = await this.subscriptionService
            .resolveSubscriptionTenantAmbiguity(permission, user, tenant, subscriberTenantHint || null);

        if (ambiguityResult.ambiguousTenants) {
            return {
                granted: false,
                ambiguousTenants: ambiguityResult.ambiguousTenants.map(t => ({
                    id: t.id, domain: t.domain, name: t.name,
                })),
            };
        }

        // Resolved — return the hint to bake into the auth code
        return {
            granted: true,
            resolvedHint: ambiguityResult.resolvedTenant?.domain,
        };
    }

    /**
     * Orchestrates the refresh_token grant:
     * consume + rotate → resolve user/tenant → check locked → re-fetch roles → issue access token → format response.
     */
    async refreshToken(
        plaintextToken: string,
        clientId: string,
        requestedScope?: string,
        resource?: string,
        oauthClientId?: string,
    ): Promise<TokenResponse> {
        const {plaintext: newRefreshToken, record} = await this.refreshTokenService.consumeAndRotate({
            plaintextToken,
            clientId,
            requestedScope,
        });

        const permission = this.securityService.createPermissionForTokenIssuance(record.tenantId);

        const user = await this.usersService.findById(permission, record.userId);
        if (user.locked) {
            throw OAuthException.invalidGrant("The refresh token is invalid or has expired");
        }

        const tenant = await this.tenantService.findById(permission, record.tenantId);

        // Resolve the Client entity from the tenant's domain alias for ID token audience.
        // Requirements: 3.2, 3.3, 3.6
        const client = await this.resolveClient(tenant);

        const roleNames = await this.claimsService.fetchAndFormatRoles(permission, tenant.id, user);

        const grantedScopes = ScopeNormalizer.parse(record.scope);

        // Construct audience with resource indicator if present
        const audience = this.claimsService.buildAudience(resource, this.configService.get("SUPER_TENANT_DOMAIN"));

        const {accessToken, scopes} =
            await this.authService.createUserAccessToken(user, tenant, grantedScopes, roleNames, GRANT_TYPES.REFRESH_TOKEN, audience, client.clientId);

        const {authTime, sessionId} = await this.claimsService.resolveRefreshSession(record.sid);

        const idToken = await this.idTokenService.generateIdToken({
            user: {id: user.id, email: user.email, name: user.name, verified: user.verified},
            tenantId: tenant.id,
            clientId: oauthClientId ?? client.clientId,
            grantedScopes: scopes,
            accessToken,
            authTime,
            sessionId,
            amr: ["pwd"],
        });

        const response = this.formatResponse(accessToken, newRefreshToken, scopes, idToken);

        // Log token issuance event (Requirements 3.4)
        this.securityEventLogger.tokenIssued({
            grantType: 'refresh_token',
            clientId: client.clientId,
            tenantId: tenant.id,
            scope: response.scope,
            userId: user.id,
        });

        return response;
    }

    /**
     * Issues a token for client_credentials grant (machine-to-machine).
     * No refresh_token or id_token — there is no user identity.
     * Per RFC 6749 §4.4.3, the response MUST NOT include a refresh_token.
     * Requirements: 3.5
     */
    async issueClientCredentialsToken(
        client: Client,
        requestedScope: string | null,
        resource?: string,
    ): Promise<TokenResponse> {
        const grantedScopes = this.claimsService.resolveScopes(
            requestedScope,
            client,
        );

        // Construct audience with resource indicator if present
        const audience = this.claimsService.buildAudience(resource, this.configService.get("SUPER_TENANT_DOMAIN"));

        const accessToken = await this.authService.createTechnicalAccessToken(
            client,
            grantedScopes,
            audience,
        );
        const response = this.formatResponse(accessToken, undefined, grantedScopes);

        // Log token issuance event (Requirements 3.4, 3.5)
        this.securityEventLogger.tokenIssued({
            grantType: 'client_credentials',
            clientId: client.clientId,
            tenantId: client.tenantId,
            scope: response.scope,
        });

        return response;
    }

    private async issueSubscribedToken(
        permission: Permission,
        user: User,
        tenant: Tenant,
        client: Client,
        options?: IssueTokenOptions,
    ): Promise<TokenResponse> {
        let hint = options?.subscriberTenantHint;
        const nonce = options?.nonce;

        // Check auth code for stored hint
        if (options?.authCode) {
            if (await this.authCodeService.hasAuthCodeWithHint(options.authCode)) {
                const authCodeObj = await this.authCodeService.findByCode(options.authCode);
                if (authCodeObj?.subscriberTenantHint) {
                    hint = hint || authCodeObj.subscriberTenantHint;
                }
            }
        }

        const ambiguityResult = await this.subscriptionService
            .resolveSubscriptionTenantAmbiguity(permission, user, tenant, hint);

        if (ambiguityResult.ambiguousTenants) {
            throw new BadRequestException("Multiple subscription tenants found. Please specify a subscriber_tenant_hint.");
        }

        const subscribingTenant = ambiguityResult.resolvedTenant!;

        const allRoleNames = await this.claimsService.fetchAndFormatRoles(permission, subscribingTenant.id, user);

        const grantedScopes = this.claimsService.resolveScopes(
            options?.requestedScope ?? null,
            client,
        );

        // Construct audience with resource indicator if present
        const audience = this.claimsService.buildAudience(options?.resource, this.configService.get("SUPER_TENANT_DOMAIN"));

        const {accessToken, scopes} =
            await this.authService.createSubscribedUserAccessToken(
                user, tenant, subscribingTenant, grantedScopes, allRoleNames, options?.grant_type ?? GRANT_TYPES.PASSWORD, audience, client.clientId,
            );

        const {authTime, sessionId} = await this.claimsService.resolveUserSession(
            options?.sid,
            options?.grant_type,
            user.id,
            tenant.id,
            options?.requireAuthTime,
        );

        // Determine refresh token eligibility (Requirements: 1.1, 1.2, 2.1, 2.2, 8.1, 8.2, 8.3)
        const refreshTokenDecision = this.claimsService.shouldIssueRefreshToken(
            scopes,
            client,
            options?.grant_type ?? GRANT_TYPES.PASSWORD,
        );

        // Log the refresh token decision
        this.securityEventLogger.refreshTokenDecision({
            grantType: options?.grant_type ?? GRANT_TYPES.PASSWORD,
            clientId: client.clientId,
            tenantId: tenant.id,
            userId: user.id,
            decision: refreshTokenDecision.eligible ? 'granted' : 'denied',
            reason: refreshTokenDecision.reason,
        });

        // Conditionally create refresh token based on eligibility
        let refreshToken: string | undefined;
        if (refreshTokenDecision.eligible) {
            const {plaintext} = await this.refreshTokenService.create({
                userId: user.id,
                clientId: client.clientId,
                tenantId: tenant.id,
                scope: ScopeNormalizer.format(scopes),
                sid: sessionId,
            });
            refreshToken = plaintext;
        }

        // Use the OAuth client_id from the request for the ID token audience (aud) claim
        // per OIDC Core §2. Requirements: 3.3
        const idTokenClientId = options?.oauthClientId ?? client.clientId;
        const idToken = await this.idTokenService.generateIdToken({
            user: {id: user.id, email: user.email, name: user.name, verified: user.verified},
            tenantId: tenant.id,
            clientId: idTokenClientId,
            grantedScopes: scopes,
            accessToken,
            nonce,
            authTime,
            sessionId,
            amr: ["pwd"],
        });

        const response = this.formatResponse(accessToken, refreshToken, scopes, idToken);

        // Log token issuance event (Requirements 3.4)
        this.securityEventLogger.tokenIssued({
            grantType: options?.grant_type ?? GRANT_TYPES.PASSWORD,
            clientId: client.clientId,
            tenantId: tenant.id,
            scope: response.scope,
            userId: user.id,
        });

        return response;
    }

    private formatResponse(
        accessToken: string,
        refreshToken: string | undefined,
        scopes: string[],
        idToken?: string,
    ): TokenResponse {
        const raw = this.configService.get("TOKEN_EXPIRATION_TIME_IN_SECONDS", "3600");
        const expiresIn = parseInt(raw, 10);

        if (!Number.isFinite(expiresIn) || !Number.isInteger(expiresIn) || expiresIn <= 0) {
            throw new InternalServerErrorException(
                "Invalid TOKEN_EXPIRATION_TIME_IN_SECONDS configuration: must be a finite positive integer",
            );
        }

        const response: TokenResponse = {
            access_token: accessToken,
            token_type: "Bearer",
            expires_in: expiresIn,
            scope: ScopeNormalizer.format(scopes || []),
        };

        if (refreshToken) {
            response.refresh_token = refreshToken;
        }

        if (idToken) {
            response.id_token = idToken;
        }

        return response;
    }

    /**
     * Resolve the Client entity for scope resolution, refresh token binding, and ID token audience.
     * When oauthClientId is provided, resolves that specific client (by UUID or alias).
     * Falls back to the tenant's default client (by domain alias) when no oauthClientId is given.
     * Requirements: 3.1
     */
    private async resolveClient(tenant: Tenant, oauthClientId?: string): Promise<Client> {
        try {
            const client = oauthClientId
                ? await this.clientService.findByClientIdOrAlias(oauthClientId)
                : await this.clientService.findByAlias(tenant.domain);
            if (client) {
                return client;
            }
        } catch {
            // Fall through to throw error
        }
        throw OAuthException.invalidClient('Client not found');
    }
}
