# Admin User API

## Overview

The Admin User API provides super admin endpoints for managing user accounts across the entire system. Unlike the
[User Management API](user-management-api.md) which operates on the authenticated user's own account, this API allows
super admins to create, update, delete, and manage any user.

All endpoints require a valid Bearer access token with the `SUPER_ADMIN` role from the super tenant
(`auth.server.com`).

**Base path:** `/api/users`

---

## Authentication

All endpoints require an `Authorization` header with a valid Bearer token issued by the super tenant:

```http
Authorization: Bearer <access_token>
```

---

## Roles and Permissions

| Role           | Permissions                                        |
|----------------|----------------------------------------------------|
| `SUPER_ADMIN`  | Full access to all endpoints                       |

> **Note:** All endpoints in this controller are guarded by `JwtAuthGuard` and `SuperAdminGuard`.

---

## List Users

```http
GET /api/users
```

`protected`  `application/json`

Returns all users in the system.

**Response**

```json
[
    {
        "id": "u1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "email": "alice@example.com",
        "name": "Alice Smith",
        "verified": true,
        "locked": false,
        "createdAt": "2024-01-15T10:00:00.000Z"
    }
]
```

| Field      | Type    | Description                                         |
|------------|---------|-----------------------------------------------------|
| `id`       | string  | UUID of the user                                    |
| `email`    | string  | Email address                                       |
| `name`     | string  | Display name                                        |
| `verified` | boolean | Whether the email has been verified                 |
| `locked`   | boolean | Whether the account is locked                       |
| `createdAt`| string  | ISO 8601 timestamp of user creation                 |

**Error Responses**

| Status | Description                         |
|--------|-------------------------------------|
| `401`  | Missing or invalid access token     |
| `403`  | Insufficient permissions            |

---

## Get User

```http
GET /api/users/:userId
```

`protected`  `application/json`

Returns details for a specific user.

**Path Parameters**

| Parameter | Description            |
|-----------|------------------------|
| `userId`  | UUID of the user       |

**Response**

Single user object (same shape as list item).

**Error Responses**

| Status | Description                     |
|--------|---------------------------------|
| `401`  | Missing or invalid access token |
| `403`  | Insufficient permissions        |
| `404`  | User not found                  |

---

## Create User

```http
POST /api/users/create
```

`protected`  `application/json`

Creates a new user account.

**Request Body**

```json
{
    "name": "Alice Smith",
    "email": "alice@example.com",
    "password": "secure-password-here"
}
```

| Parameter  | Required | Type   | Description                    |
|------------|----------|--------|--------------------------------|
| `name`     | Yes      | string | Display name for the user      |
| `email`    | Yes      | string | Email address (must be unique) |
| `password` | Yes      | string | Initial password               |

**Response**

Returns the created user object.

**Error Responses**

| Status | Description                     |
|--------|---------------------------------|
| `400`  | Invalid request body            |
| `401`  | Missing or invalid access token |
| `403`  | Insufficient permissions        |
| `409`  | Email already exists            |

---

## Update User

```http
PUT /api/users/update
```

`protected`  `application/json`

Updates a user's name and email.

**Request Body**

```json
{
    "id": "u1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Alice Johnson",
    "email": "alice.johnson@example.com"
}
```

| Parameter | Required | Type   | Description                    |
|-----------|----------|--------|--------------------------------|
| `id`      | Yes      | string | UUID of the user to update     |
| `name`    | Yes      | string | New display name               |
| `email`   | Yes      | string | New email address              |

**Response**

Returns the updated user object.

**Error Responses**

| Status | Description                     |
|--------|---------------------------------|
| `400`  | Invalid request body            |
| `401`  | Missing or invalid access token |
| `403`  | Insufficient permissions        |
| `404`  | User not found                  |

---

## Delete User

```http
DELETE /api/users/:id
```

`protected`  `application/json`

Permanently deletes a user account and all associated data.

**Path Parameters**

| Parameter | Description            |
|-----------|------------------------|
| `id`      | UUID of the user       |

**Response**

```json
{
    "success": true
}
```

**Error Responses**

| Status | Description                     |
|--------|---------------------------------|
| `401`  | Missing or invalid access token |
| `403`  | Insufficient permissions        |
| `404`  | User not found                  |

---

## Get User Tenants

```http
GET /api/users/:userId/tenants
```

`protected`  `application/json`

Returns all tenants a user is a member of.

**Path Parameters**

| Parameter | Description            |
|-----------|------------------------|
| `userId`  | UUID of the user       |

**Response**

Array of tenant objects the user belongs to, including their roles in each tenant.

---

## Email Verification

```http
PUT /api/users/verify-user
```

`protected`  `application/json`

Manually sets a user's email verification status.

**Request Body**

```json
{
    "email": "alice@example.com",
    "verify": true
}
```

| Parameter | Required | Type    | Description                                       |
|-----------|----------|---------|---------------------------------------------------|
| `email`   | Yes      | string  | Email address of the user                         |
| `verify`  | Yes      | boolean | `true` to verify, `false` to unverify             |

**Response**

Returns the updated user object.

---

## Account Locking

### Lock User

```http
PUT /api/users/:userId/lock
```

`protected`  `application/json`

Locks a user account, preventing login.

**Path Parameters**

| Parameter | Description            |
|-----------|------------------------|
| `userId`  | UUID of the user       |

**Response**

Returns the updated user object with `locked: true`.

### Unlock User

```http
PUT /api/users/:userId/unlock
```

`protected`  `application/json`

Unlocks a previously locked user account.

**Path Parameters**

| Parameter | Description            |
|-----------|------------------------|
| `userId`  | UUID of the user       |

**Response**

Returns the updated user object with `locked: false`.

---

## Update User Password

```http
PUT /api/users/:userId/password
```

`protected`  `application/json`

Resets a user's password. No current password is required.

**Path Parameters**

| Parameter | Description            |
|-----------|------------------------|
| `userId`  | UUID of the user       |

**Request Body**

```json
{
    "password": "new-secure-password",
    "confirmPassword": "new-secure-password"
}
```

| Parameter         | Required | Type   | Description                     |
|-------------------|----------|--------|---------------------------------|
| `password`        | Yes      | string | New password                    |
| `confirmPassword` | Yes      | string | Must match `password` exactly   |

**Response**

```json
{
    "success": true
}
```

**Error Responses**

| Status | Description                                |
|--------|--------------------------------------------|
| `400`  | Passwords do not match or validation fails |
| `401`  | Missing or invalid access token            |
| `403`  | Insufficient permissions                   |
| `404`  | User not found                             |
