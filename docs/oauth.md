# OAuth API

## Overview

The OAuth API implements the OAuth 2.0 authorization framework per [RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749)
with mandatory PKCE support per [RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636). It provides the authorization
endpoint and the token endpoint, supporting four grant types.

**Base path:** `/api/oauth`

---

## Authorization Endpoint

### Authorize (Authorization Code Flow Entry Point)

```http
GET /api/oauth/authorize
```

`public`  `query parameters`

Initiates the OAuth 2.0 Authorization Code flow per [RFC 6749 §4.1](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1).
Validates the client's authorization request parameters and redirects the user-agent to the login UI. This endpoint does
not authenticate users or issue authorization codes directly — after the user logs in, the login flow creates the
authorization code and redirects back to the client.

**Request (query parameters)**

| Parameter               | Required    | Description                                                                                                                                |
|-------------------------|-------------|--------------------------------------------------------------------------------------------------------------------------------------------|
| `response_type`         | Yes         | Must be `code`                                                                                                                             |
| `client_id`             | Yes         | The registered OAuth client identifier                                                                                                     |
| `redirect_uri`          | Conditional | Must exactly match a registered redirect URI. If the client has exactly one registered URI, this may be omitted.                           |
| `state`                 | Yes         | Opaque value for CSRF protection. Returned unmodified in the redirect.                                                                     |
| `scope`                 | No          | Space-delimited OIDC scope values (e.g., `openid profile email`). Defaults to the client's allowed scopes if omitted.                      |
| `code_challenge`        | Conditional | Required if the client has PKCE enforcement enabled. Base64url-encoded challenge value.                                                    |
| `code_challenge_method` | No          | `plain` or `S256`. Defaults to `plain` if `code_challenge` is present but method is omitted. Must be `S256` when the client requires PKCE. |
| `nonce`                 | No          | Opaque value for ID token replay protection. Max 512 characters.                                                                           |
| `prompt`                | No          | Controls authentication behavior: `none`, `login`, `consent`, `select_account`. See [Login Sessions](login-sessions.md).                   |
| `max_age`               | No          | Maximum authentication age in seconds. If exceeded, re-authentication is forced.                                                           |

**Example**

```http
GET /api/oauth/authorize?response_type=code&client_id=my-client&redirect_uri=https://app.example.com/callback&state=abc123&scope=openid%20profile&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256&nonce=n-0S6_WzA2Mj
```

**Success Response**

```
HTTP/1.1 302 Found
Location: /authorize?client_id=my-client&redirect_uri=https://app.example.com/callback&scope=openid+profile&state=abc123&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256&nonce=n-0S6_WzA2Mj
```

Redirects to the login UI with all validated parameters forwarded as query parameters.

**Error Responses**

Errors are split into two categories based on whether a trusted redirect URI has been established:

*Pre-redirect errors* — returned as JSON directly (no redirect):

| Scenario                                                       | HTTP Status | Error Code                  |
|----------------------------------------------------------------|-------------|-----------------------------|
| `response_type` missing or not `code`                          | 400         | `unsupported_response_type` |
| `client_id` missing or unknown                                 | 400         | `invalid_request`           |
| `redirect_uri` does not match any registered URI               | 400         | `invalid_request`           |
| `redirect_uri` omitted and client has multiple registered URIs | 400         | `invalid_request`           |

```json
{
    "error": "invalid_request",
    "error_description": "The redirect_uri does not match any registered redirect URI"
}
```

*Post-redirect errors* — redirected to the client's `redirect_uri` with error query parameters:

| Scenario                                                 | Error Code        |
|----------------------------------------------------------|-------------------|
| `state` parameter missing                                | `invalid_request` |
| `code_challenge` missing when PKCE is required           | `invalid_request` |
| `code_challenge_method` is `plain` when S256 is required | `invalid_request` |
| PKCE downgrade from S256 to plain                        | `invalid_request` |
| `nonce` exceeds 512 characters                           | `invalid_request` |

```
HTTP/1.1 302 Found
Location: https://app.example.com/callback?error=invalid_request&error_description=The+state+parameter+is+required+for+CSRF+protection&state=abc123
```

---

## Token Endpoint

All grant types use the same endpoint path with different `grant_type` values and parameters.

### Authorization Code Grant

```http
POST /api/oauth/token
```

`public`  `application/json`

Exchanges an authorization code for tokens per [RFC 6749 §4.1.3](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.3).
This is the recommended grant type for all user-facing applications. PKCE is mandatory.

**Request**

```json
{
    "grant_type": "authorization_code",
    "code": "string",
    "redirect_uri": "string",
    "client_id": "string",
    "client_secret": "string",
    "code_verifier": "string"
}
```

| Parameter       | Required | Type   | Description                                                         |
|-----------------|----------|--------|---------------------------------------------------------------------|
| `grant_type`    | Yes      | string | Must be `authorization_code`                                        |
| `code`          | Yes      | string | The authorization code received from the redirect                   |
| `redirect_uri`  | Yes      | string | Must match the `redirect_uri` from the authorization request        |
| `client_id`     | Yes      | string | The OAuth client identifier                                         |
| `client_secret` | Yes      | string | The client secret for authentication                                |
| `code_verifier` | Yes      | string | The PKCE code verifier used to generate the `code_challenge`        |

**Response**

```json
{
    "access_token": "eyJhbGciOiJSUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "refresh_token": "opaque-refresh-token-string",
    "id_token": "eyJhbGciOiJSUzI1NiIs...",
    "scope": "openid profile email"
}
```

| Field          | Type   | Description                                                      |
|----------------|--------|------------------------------------------------------------------|
| `access_token` | string | Signed JWT access token                                          |
| `token_type`   | string | Always `Bearer`                                                  |
| `expires_in`   | number | Token lifetime in seconds                                        |
| `refresh_token`| string | Opaque refresh token (see [Refresh Token Rotation](refresh-token-rotation.md)) |
| `id_token`     | string | Signed JWT ID token (only when `openid` scope is requested)     |
| `scope`        | string | Space-delimited granted scopes                                   |

**Error Responses**

| Status | Error Code          | Description                          |
|--------|---------------------|--------------------------------------|
| `400`  | `invalid_grant`     | Expired or already consumed code     |
| `400`  | `invalid_request`   | Missing required parameters          |
| `401`  | `invalid_client`    | Invalid client credentials           |
| `400`  | `invalid_grant`     | PKCE code_verifier does not match    |

---

### Password Grant (Legacy)

```http
POST /api/oauth/token
```

`public`  `application/json`

> **Deprecated:** This legacy grant is retained only for backward compatibility. New applications must use the
> authorization code flow with PKCE. It is intentionally omitted from OIDC discovery metadata.
>
> Per [RFC 9700 §2.4](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.4), new OAuth deployments must not use
> the resource owner password credentials grant. If a confidential client is permitted to use this legacy endpoint,
> it must authenticate with its `client_secret`.

**Request**

```json
{
    "grant_type": "password",
    "client_id": "string",
    "client_secret": "string (confidential clients only)",
    "username": "user@example.com",
    "password": "string",
    "scope": "openid profile email"
}
```

| Parameter       | Required | Type   | Description |
|-----------------|----------|--------|-------------|
| `grant_type`    | Yes      | string | Must be `password` |
| `client_id`     | Yes      | string | Registered client ID or alias |
| `client_secret` | Conditional | string | Required for confidential clients; omit for public clients |
| `username`      | Yes      | string | Resource owner's email address |
| `password`      | Yes      | string | Resource owner's password |
| `scope`         | No       | string | Requested OAuth scopes |

**Response**

```json
{
    "access_token": "eyJhbGciOiJSUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "refresh_token": "opaque-refresh-token-string"
}
```

---

### Client Credentials Grant

```http
POST /api/oauth/token
```

`public`  `application/json`

Machine-to-machine authentication per [RFC 6749 §4.4](https://datatracker.ietf.org/doc/html/rfc6749#section-4.4).
Issues a technical token with no user context.

**Request**

```json
{
    "grant_type": "client_credentials",
    "client_id": "string",
    "client_secret": "string"
}
```

| Parameter      | Required | Type   | Description                      |
|----------------|----------|--------|----------------------------------|
| `grant_type`   | Yes      | string | Must be `client_credentials`     |
| `client_id`    | Yes      | string | The OAuth client identifier      |
| `client_secret`| Yes      | string | The client secret                |

**Response**

```json
{
    "access_token": "eyJhbGciOiJSUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 3600
}
```

> **Note:** Client credentials tokens have no `refresh_token` and no `roles` claim. They carry only `scopes`.

---

### Refresh Token Grant

```http
POST /api/oauth/token
```

`public`  `application/json`

Exchange a refresh token for a new access token. Refresh tokens are opaque, single-use strings that rotate on every
request. Each successful refresh invalidates the old token and returns a new one. See
[Refresh Token Rotation](refresh-token-rotation.md) for details.

**Request**

```json
{
    "grant_type": "refresh_token",
    "refresh_token": "string (opaque token)",
    "client_id": "string",
    "client_secret": "string",
    "scope": "string (optional, space-delimited, must be subset of original)"
}
```

| Field           | Required | Description                                                                                                                  |
|-----------------|----------|------------------------------------------------------------------------------------------------------------------------------|
| `grant_type`    | Yes      | Must be `refresh_token`                                                                                                      |
| `refresh_token` | Yes      | The opaque refresh token from a previous token response                                                                      |
| `client_id`     | Yes      | The client identifier that originally obtained the token                                                                     |
| `client_secret` | Yes      | The client secret for authentication                                                                                         |
| `scope`         | No       | Space-delimited scope string. Must be a subset of the originally granted scope. If omitted, the original scope is preserved. |

**Response**

```json
{
    "access_token": "eyJhbGciOiJSUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "refresh_token": "new-rotated-refresh-token",
    "scope": "openid profile email"
}
```

> **Important:** The response contains a new `refresh_token`. Clients must store this new token and discard the old one.
> Reusing a previously consumed token will revoke the entire token family.

---

## RP-Initiated Logout

```http
GET /api/oauth/logout
```

`public`  `query parameters`

Implements [OpenID Connect RP-Initiated Logout 1.0](https://openid.net/specs/openid-connect-rpinitiated-logout-1_0.html).
Ends the user's session and optionally redirects back to the client.

**Query Parameters**

| Parameter               | Required | Description                                                                 |
|-------------------------|----------|-----------------------------------------------------------------------------|
| `id_token_hint`         | No       | ID token previously issued to the client. Used to identify the session.     |
| `client_id`             | No*      | Client identifier (required if `id_token_hint` is not provided).            |
| `post_logout_redirect_uri` | No    | URI to redirect to after logout. Must be a registered redirect URI.         |
| `state`                 | No       | Opaque value returned in the redirect for client-side state management.     |

\* Either `id_token_hint` or `client_id` must be provided.

**Success Response**

```
HTTP/1.1 302 Found
Location: https://app.example.com/logged-out?state=abc123
```

If no `post_logout_redirect_uri` is specified, the user is redirected to a default logout confirmation page.

**Error Responses**

| Status | Description                                      |
|--------|--------------------------------------------------|
| `400`  | Neither `id_token_hint` nor `client_id` provided |
| `400`  | `post_logout_redirect_uri` not registered for client |

> See also `POST /api/oauth/logout` in [Token Revocation](token-revocation.md) for programmatic logout.

---

## User Consent

```http
POST /api/oauth/consent
```

`public`  `application/json`

Submits the user's consent decision during the authorization flow. Reads signed cookies `flow_id` and `sid` to identify
the ongoing authorization session.

**Request Body**

```json
{
    "client_id": "my-client",
    "scope": "openid profile email",
    "csrf_token": "csrf-token-from-form",
    "decision": "grant"
}
```

| Parameter    | Required | Type   | Description                                           |
|--------------|----------|--------|-------------------------------------------------------|
| `client_id`  | Yes      | string | The client requesting authorization                   |
| `scope`      | No       | string | Space-delimited scopes being consented to             |
| `csrf_token` | Yes      | string | CSRF token from the consent form                      |
| `decision`   | Yes      | string | `grant` to approve the request, `deny` to reject it   |

**Response**

```json
{
    "success": true
}
```

See [User Consent Flow](user-consent.md) for the full consent lifecycle.

---

## Grant Type Reference

| Grant Type             | RFC          | User Context | Refresh Token | PKCE  | Use Case                                    |
|------------------------|--------------|--------------|---------------|-------|---------------------------------------------|
| `authorization_code`   | RFC 6749 §4.1| Yes          | Yes           | Yes   | User-facing apps (SPAs, mobile, web)        |
| `password`             | RFC 6749 §4.3| Yes          | Yes           | No    | Legacy/trusted apps (avoid for new apps)    |
| `client_credentials`   | RFC 6749 §4.4| No           | No            | No    | Machine-to-machine, service accounts        |
| `refresh_token`        | RFC 6749 §6  | Yes          | Yes (rotation)| No    | Token renewal without re-authentication     |
