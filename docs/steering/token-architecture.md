---
inclusion: manual
---

# Token Architecture — Scope/Role Separation

The JWT token model separates OAuth scopes from internal roles. These are independent concerns and must never be mixed.

## Token Types

| Token Type       | Grant Type        | Has User | Contains `roles` | Contains `scopes` | Refresh Token |
|------------------|-------------------|----------|-------------------|---------------------|---------------|
| `TenantToken`    | `authorization_code`, `password`, `refresh_token` | Yes | Yes | Yes | Yes |
| `TechnicalToken` | `client_credentials` | No | No — `roles` field absent | Yes | No |

## Token Fields

| Field                   | Contains                                                   | Used By                  | Purpose                            |
|-------------------------|------------------------------------------------------------|--------------------------|------------------------------------|
| `sub` (JWT)            | User UUID (TenantToken) or Client UUID (TechnicalToken)    | All consumers            | Subject identifier per RFC 7519    |
| `scopes` (JWT)         | OIDC values: `openid`, `profile`, `email`                  | OAuth client libraries   | Client access control per RFC 6749 |
| `roles` (JWT)          | Role enums and namespaced app-owned roles (`{clientAlias}:{roleName}`) | CASL ability factory, UI | User authorization                 |
| `scope` (HTTP response)| Space-delimited OIDC scopes                                | OAuth client libraries   | RFC 6749 §3.3 compliance           |
| `tenant` (JWT)         | `{ id, name, domain }`                                     | All consumers            | Tenant context for this token      |
| `email` (JWT)          | User email string                                          | Resource servers         | User identity                      |
| `grant_type` (JWT)     | `authorization_code`, `password`, `client_credentials`, `refresh_token` | Resource servers | How the token was obtained        |
| `iat` (JWT)            | Issued-at Unix timestamp                                   | All consumers            | RFC 7519                           |
| `exp` (JWT)            | Expiration Unix timestamp                                  | All consumers            | RFC 7519                           |
| `iss` (JWT)            | Issuer URL (tenant-scoped)                                 | All consumers            | RFC 7519                           |
| `aud` (JWT)            | Audience claim — see [Audience Model](audience-model.md)   | Resource servers         | Token validation                   |

## Rules

- `scopes` must only contain OIDC values. Never put role names in `scopes`.
- `roles` must only contain role enum names (`SUPER_ADMIN`, `TENANT_ADMIN`, `TENANT_VIEWER`) and namespaced app-owned roles (`{clientAlias}:{roleName}`). Never put OIDC values in `roles`.
- CASL abilities are derived from `token.roles`, never from `token.scopes`.
- `isSuperAdmin` checks `roles.includes('SUPER_ADMIN')` combined with the super tenant domain. It does not check scopes or app-owned roles.
- OAuth scope resolution is a two-way intersection: `requested \u2229 client.allowedScopes`. Roles are not involved in scope
  computation.
- When `scope` is omitted from a token request, the client's full `allowedScopes` are used as the default.
- `TechnicalToken` (client_credentials) has `scopes` but no `roles` field — there is no user.
- `TenantToken` (user grants) has both `scopes` and `roles`.

## Role Naming Conventions

| Role Type    | Format             | Example                                        | Namespace     |
|--------------|--------------------|------------------------------------------------|---------------|
| Internal     | `ROLE_NAME`        | `SUPER_ADMIN`, `TENANT_ADMIN`, `TENANT_VIEWER` | Global        |
| Tenant-local | `roleName`         | `reviewer`, `billing-admin`, `developer`       | Per tenant    |
| App-owned    | `appName:roleName` | `todo-app:editor`, `crm-app:sales-manager`     | Per app       |

- Internal and tenant-local role names must never contain the `:` separator.
- App-owned roles must always use the `{clientAlias}:{roleName}` format.
- A role name alone is ambiguous — `reviewer` could be a tenant-local role or an old naming convention. Always include
  the full namespaced form in tokens.

## Token Issuance Flow

```
[Token Request] 
  -> [Client Auth] -> [Password/Code/Client validation]
  -> [ScopeResolverService.resolveScopes(requested, clientAllowed)]  // Two-way intersection
  -> [fetch user roles from DB]
  -> [AuthService.createUserAccessToken(user, tenant, scopes, roles)]  // Separate params
  -> [TokenService.sign(payload)]  // RSA sign with tenant's private key
  -> [Persist refresh token family in DB]
  -> [Return { access_token, refresh_token, id_token?, scope, token_type, expires_in }]
```

## Key Services

| Service                          | Responsibility                                                                                    |
|----------------------------------|---------------------------------------------------------------------------------------------------|
| `ScopeResolverService`          | Computes the two-way intersection of requested scopes and client allowed scopes. Throws `invalid_scope` if empty. |
| `ScopeNormalizer`               | Splits, deduplicates, sorts scope strings. Pure utility, no role awareness.                       |
| `CaslAbilityFactory`            | Reads `token.roles` to build CASL permission rules. Never reads `token.scopes`.                   |
| `SecurityService.isSuperAdmin()`| Checks `token.roles` for `SUPER_ADMIN` + super tenant domain (`auth.server.com`).                 |
| `AuthService.createUserAccessToken()` | Accepts scopes and roles as separate parameters. Builds the JWT payload.                    |
| `TokenIssuanceService`          | Orchestrates scope resolution (two-way) and role fetching from DB, then delegates to AuthService.  |
| `TokenService.sign()`           | RSA-signs the JWT payload using the tenant's private key.                                         |
| `TokenService.verify()`         | Verifies RSA signature and expiration. Called by `JwtAuthGuard` and `JwtStrategy`.                |

## Default Scopes

- Client allowed scopes default: `openid profile email`
- Technical token default scopes: `['openid', 'profile', 'email']`
- Do not include `tenant.read`, `tenant.write`, or any role-derived values in scope defaults.

## Token Verification

### Local Verification (Recommended for Resource Servers)

Resource servers should verify tokens locally using the tenant's JWKS endpoint. This avoids a network roundtrip to the
auth server for every request. See [Resource Server Verification](resource-server-verification.md) and
[JWKS Endpoint](jwks-endpoint.md) for implementation details and caching strategies.

### Remote Verification

For cases where local verification is not feasible, use the `/api/oauth/verify` or `/api/oauth/introspect` endpoints.
See [Token API](token-api.md).

## UI Integration

- `DecodedToken` interface has both `scopes: string[]` and `roles: string[]`.
- `isSuperAdmin()` and `isTenantAdmin()` read from `roles`, not `scopes`.
- `TokenVerificationService` validates both `scopes` and `roles` are present arrays.
- The UI admin and user sections are completely independent — no shared components, dialogs, or API services.
