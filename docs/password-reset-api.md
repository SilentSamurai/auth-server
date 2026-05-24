# Password Reset API

## Overview

The Password Reset API provides endpoints for the forgot-password flow. Users request a password reset link via email,
then complete the reset by submitting a new password with the emailed token.

**Base path:** `/api/oauth`

---

## Authentication

These endpoints are public — no access token is required.

---

## Forgot Password

```http
POST /api/oauth/forgot-password
```

`public`  `application/json`

Initiates the password reset flow. If the email address belongs to a registered user, a password reset email is sent
with a unique reset token link. The response is always `200` regardless of whether the email exists, to prevent user
enumeration.

**Request Body**

```json
{
    "email": "user@example.com"
}
```

| Parameter | Required | Type   | Description                |
|-----------|----------|--------|----------------------------|
| `email`   | Yes      | string | Email address of the user  |

**Response**

```json
{
    "email": "user@example.com"
}
```

> **Security note:** The endpoint always returns successfully to prevent email enumeration attacks. Whether the email
> exists in the system is not revealed.

**Flow**

1. Client submits an email address.
2. If the email exists in the system, a password reset token is generated and emailed to the user.
3. The user clicks the link containing the token, which takes them to the reset password page.
4. The token is single-use and expires after a configured duration.

**Error Responses**

| Status | Description              |
|--------|--------------------------|
| `400`  | Invalid email format     |

---

## Reset Password

```http
POST /api/oauth/reset-password/:token
```

`public`  `application/json`

Completes the password reset flow. Accepts the reset token from the email link and the new password.

**Path Parameters**

| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `token`   | The reset token received via the email link      |

**Request Body**

```json
{
    "password": "new-secure-password"
}
```

| Parameter  | Required | Type   | Description          |
|------------|----------|--------|----------------------|
| `password` | Yes      | string | The new password     |

**Response**

```json
{
    "success": true
}
```

After a successful reset:
- The user's password is updated.
- The reset token is invalidated (single-use).
- Any existing sessions for the user may be invalidated (depending on configuration).

**Error Responses**

| Status | Description                                       |
|--------|---------------------------------------------------|
| `400`  | Invalid password (too weak or validation failure) |
| `404`  | Invalid or expired reset token                    |

---

## Email Templates

The password reset email is sent to the user's registered email address. The email contains a link with the reset token
as a path parameter. The exact format and branding of the email is configurable in the server environment settings.
