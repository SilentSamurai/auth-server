# Token API

## Overview

The Token API provides endpoints for token verification, exchange, introspection, and user information. These endpoints
supplement the core OAuth 2.0 token issuance and revocation flows documented in [OAuth API](oauth.md) and
[Token Revocation](token-revocation.md).

**Base path:** `/api/oauth`

---

## Verify Access Token

```http
POST /api/oauth/verify
```

`public`  `application/json`

Verifies an access token and returns the associated claims. This is a simplified verification endpoint for resource
servers that do not need to perform local JWT verification.

**Request**

```json
{
    "access_token": "string",
    "client_id": "string",
    "client_secret": "string"
}
```

| Parameter      | Required | Type   | Description                          |
|----------------|----------|--------|--------------------------------------|
| `access_token` | Yes      | string | The access token to verify           |
| `client_id`    | Yes      | string | Client identifier for authentication |
| `client_secret`| Yes      | string | Client secret for authentication     |

**Response**

```json
{
    "sub": "u1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "email": "alice@example.com",
    "name": "Alice Smith",
    "tenant": {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "name": "Acme Corp",
        "domain": "acme.example.com"
    },
    "scopes": ["openid", "profile", "email"],
    "grant_type": "password"
}
```

| Field            | Type     | Description                                            |
|------------------|----------|--------------------------------------------------------|
| `sub`            | string   | UUID of the token subject (user)                       |
| `email`          | string   | Email address of the user                              |
| `name`           | string   | Display name of the user                               |
| `tenant`         | object   | Tenant context from the token                          |
| `tenant.id`      | string   | UUID of the tenant                                     |
| `tenant.name`    | string   | Display name of the tenant                             |
| `tenant.domain`  | string   | Domain identifier of the tenant                        |
| `scopes`         | string[] | OIDC scopes granted to this token                      |
| `grant_type`     | string   | Grant type used to issue the token (`password` or `client_credentials`) |

> **Note:** For `client_credentials` grant tokens, `sub`, `email`, and `name` represent the client itself, not a user.
> The token also contains no `roles` field since there is no user context.

**Error Responses**

| Status | Description                          |
|--------|--------------------------------------|
| `400`  | Invalid request body                 |
| `401`  | Invalid token or client credentials  |

For a more robust verification flow with local JWT validation, see
[Resource Server Verification](resource-server-verification.md).

---

## Token Introspection (RFC 7662)

```http
POST /api/oauth/introspect
```

`public`  `application/json`

Validates a token and returns metadata about it, per [RFC 7662](https://datatracker.ietf.org/doc/html/rfc7662). Unlike
the `/verify` endpoint, introspection returns a simple `active` boolean — the caller does not learn anything about the
token unless it is valid.

**Authentication**

Client authentication is required. The client can authenticate using either:
- HTTP Basic Authentication (`Authorization: Basic <base64(client_id:client_secret)>`)
- Request body credentials (`client_id` and `client_secret` fields in the JSON body)

Both methods are accepted; Basic Auth takes priority if both are present.

**Request Body**

```json
{
    "token": "eyJhbGciOiJSUzI1NiIs...",
    "token_type_hint": "access_token",
    "client_id": "my-client",
    "client_secret": "client-secret"
}
```

| Parameter         | Required | Type   | Description                                                              |
|-------------------|----------|--------|--------------------------------------------------------------------------|
| `token`           | Yes      | string | The token value to introspect                                            |
| `token_type_hint` | No       | string | Hint about the token type (`access_token` or `refresh_token`) — may improve performance but is not required |
| `client_id`       | No*      | string | Client identifier (required if not using Basic Auth)                     |
| `client_secret`   | No*      | string | Client secret (required if not using Basic Auth)                         |

**Response — Active Token**

```json
{
    "active": true,
    "sub": "u1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "scope": "openid profile email",
    "client_id": "my-client",
    "token_type": "Bearer",
    "exp": 1705312800,
    "iat": 1705311000
}
```

| Field        | Type    | Description                                                     |
|--------------|---------|-----------------------------------------------------------------|
| `active`     | boolean | `true` if the token is valid and not expired                    |
| `sub`        | string  | Subject identifier (user UUID)                                  |
| `scope`      | string  | Space-delimited scopes granted to the token                     |
| `client_id`  | string  | Client the token was issued to                                  |
| `token_type` | string  | Always `Bearer`                                                 |
| `exp`        | number  | Expiration time as Unix timestamp (seconds)                     |
| `iat`        | number  | Issued-at time as Unix timestamp (seconds)                      |

**Response — Inactive Token**

```json
{
    "active": false
}
```

Per RFC 7662, when `active` is `false`, the response contains **no other fields**. The caller cannot determine why the
token is invalid (expired, revoked, malformed, or never existed).

**Response Headers**

| Header          | Value     |
|-----------------|-----------|
| `Cache-Control` | `no-store`|
| `Pragma`        | `no-cache`|

---

## UserInfo Endpoint (OIDC)

```http
GET /api/oauth/userinfo
POST /api/oauth/userinfo
```

`protected`  `application/json`

Returns claims about the authenticated user, per [OpenID Connect Core 1.0 §5.3](https://openid.net/specs/openid-connect-core-1_0.html#UserInfo).
Both `GET` and `POST` methods are supported as required by the specification.

**Authentication**

Pass the access token in the `Authorization` header:

```http
Authorization: Bearer <access_token>
```

The token must have the `openid` scope. The endpoint rejects `client_credentials` grant tokens (only user-authenticated
tokens are accepted).

**Request (GET)**

```
GET /api/oauth/userinfo
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```

No query parameters required.

**Request (POST)**

```http
POST /api/oauth/userinfo
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
Content-Type: application/json
```

No body parameters required.

**Response — `openid` scope only**

```json
{
    "sub": "u1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Response — `openid profile email` scopes**

```json
{
    "sub": "u1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "email": "alice@example.com",
    "email_verified": true,
    "name": "Alice Smith",
    "preferred_username": "alice",
    "updated_at": 1705311000
}
```

| Field               | Type    | Scope Required | Description                                        |
|---------------------|---------|----------------|----------------------------------------------------|
| `sub`               | string  | `openid`       | Unique identifier for the user                     |
| `email`             | string  | `email`        | Email address                                      |
| `email_verified`    | boolean | `email`        | Whether the email has been verified                |
| `name`              | string  | `profile`      | Full display name                                  |
| `preferred_username`| string  | `profile`      | Short name or username                             |
| `updated_at`        | number  | `profile`      | Unix timestamp of last profile update              |

**Response Headers**

| Header          | Value     |
|-----------------|-----------|
| `Cache-Control` | `no-store`|
| `Pragma`        | `no-cache`|

**Error Responses**

| Status | Header                           | Description                                            |
|--------|----------------------------------|--------------------------------------------------------|
| `401`  | `WWW-Authenticate: Bearer`      | Missing or invalid access token                        |
| `403`  | `WWW-Authenticate: Bearer`      | Token does not have `openid` scope, or is a technical token |

---

## Access Token Exchange

```http
POST /api/oauth/exchange
```

`public`  `application/json`

Exchanges a valid access token from one tenant for credentials usable in another tenant. This enables cross-tenant
authentication flows where a user authenticated in tenant A needs to access resources in tenant B.

**Request**

```json
{
    "access_token": "string",
    "client_id": "string",
    "client_secret": "string"
}
```

| Parameter      | Required | Type   | Description                                                        |
|----------------|----------|--------|--------------------------------------------------------------------|
| `access_token` | Yes      | string | A valid access token from any tenant                               |
| `client_id`    | Yes      | string | Client ID of the **target tenant** you want credentials for        |
| `client_secret`| Yes      | string | Client secret of the target tenant                                 |

**Response**

```json
{
    "grant_type": "password",
    "email": "alice@example.com",
    "password": "exchange-derived-credential",
    "domain": "target-tenant.example.com"
}
```

| Field        | Type   | Description                                                  |
|--------------|--------|--------------------------------------------------------------|
| `grant_type` | string | Always `password` — use these credentials with the password grant |
| `email`      | string | Email from the original access token                         |
| `password`   | string | Exchange-derived credential for the target tenant            |
| `domain`     | string | Domain of the target tenant                                  |

Use the returned credentials with the [OAuth Token (Password Grant)](oauth.md#oauth-token-password-grant-type) endpoint
to obtain an access token for the target tenant.

---

## Auth Code Verification

```http
POST /api/oauth/verify-auth-code
```

`public`  `application/json`

Verifies that an authorization code is valid and has not been consumed. This is a pre-OAuth compliance utility endpoint
for debugging and testing authorization code flows.

**Request**

```json
{
    "auth_code": "string",
    "client_id": "string"
}
```

| Parameter   | Required | Type   | Description                                         |
|-------------|----------|--------|-----------------------------------------------------|
| `auth_code` | Yes      | string | The authorization code to verify                    |
| `client_id` | Yes      | string | Client ID associated with the authorization request |

---

## Session Info

```http
GET /api/oauth/session-info
```

`public`  `application/json`

Returns the current session user's email, if a valid login session exists. Reads the signed `sid` cookie.

**Response**

```json
{
    "email": "alice@example.com"
}
```

| Header          | Value     |
|-----------------|-----------|
| `Cache-Control` | `no-store`|

**Error Responses**

| Status | Description               |
|--------|---------------------------|
| `401`  | No active login session   |

---

## JWT Roles Array Format

The `roles` claim in the JWT access token contains all roles assigned to the user. Role names follow different formats
depending on their type:

| Role Type    | Format             | Example                                        | Description                                                             |
|--------------|--------------------|------------------------------------------------|-------------------------------------------------------------------------|
| Internal     | `ROLE_NAME`        | `SUPER_ADMIN`, `TENANT_ADMIN`, `TENANT_VIEWER` | Built-in auth server roles. No separator.                               |
| Tenant-local | `roleName`         | `reviewer`, `billing-admin`                    | Custom roles scoped to a single tenant. No separator.                   |
| App-owned    | `appName:roleName` | `todo-app:editor`, `crm-app:sales-manager`     | Roles defined by a subscribed app. Uses `:` as the namespace separator. |

App-owned roles are namespaced with the app name to prevent collisions when a user has roles from multiple subscribed
apps. Internal and tenant-local roles never contain the `:` separator.

**Example JWT payload** — a user with internal, tenant-local, and app-owned roles:

```json
{
    "sub": "user-uuid",
    "email": "user@example.com",
    "tenant": {
        "id": "...",
        "name": "...",
        "domain": "..."
    },
    "roles": [
        "TENANT_ADMIN",
        "reviewer",
        "todo-app:editor",
        "todo-app:viewer",
        "crm-app:sales-manager"
    ],
    "scope": "openid profile email",
    "grant_type": "password"
}
```

**Technical tokens** (`client_credentials` grant) do **not** include a `roles` field — there is no user context. They
carry `scopes` only.

For full details on app-owned role namespacing, policy resolution, and the resource server verification pattern,
see [App-Owned Roles](app-owned-roles.md).
