# Admin Tenant API

## Overview

The Admin Tenant API provides super admin endpoints for managing all tenants in the system. Unlike the [Tenant
Management API](tenant-management-api.md) which operates on "my" tenant (derived from the token), this API allows super
admins to perform operations on any tenant by specifying its ID.

All endpoints require a valid Bearer access token with the `SUPER_ADMIN` role from the super tenant
(`auth.server.com`).

**Base path:** `/api/admin/tenant`

---

## Authentication

All endpoints require an `Authorization` header with a valid Bearer token issued by the super tenant:

```http
Authorization: Bearer <access_token>
```

---

## Roles and Permissions

| Role           | Permissions                                         |
|----------------|-----------------------------------------------------|
| `SUPER_ADMIN`  | Full access to all endpoints                        |

> **Note:** All endpoints in this controller are guarded by `JwtAuthGuard` and `SuperAdminGuard`. The super tenant
> domain (`auth.server.com`) is implied in the token — you must authenticate with a token from the super tenant.

---

## List All Tenants

```http
GET /api/admin/tenant
```

`protected`  `application/json`

Returns all tenants in the system.

**Response**

Returns an array of tenant objects:

```json
[
    {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "name": "Acme Corp",
        "domain": "acme.example.com",
        "allowSignUp": false,
        "createdAt": "2024-01-01T00:00:00.000Z"
    }
]
```

| Field         | Type    | Description                                      |
|---------------|---------|--------------------------------------------------|
| `id`          | string  | UUID of the tenant                               |
| `name`        | string  | Display name of the tenant                       |
| `domain`      | string  | Unique domain identifier for the tenant          |
| `allowSignUp` | boolean | Whether self-registration is enabled             |
| `createdAt`   | string  | ISO 8601 timestamp of tenant creation            |

**Error Responses**

| Status | Description                         |
|--------|-------------------------------------|
| `401`  | Missing or invalid access token     |
| `403`  | Insufficient permissions            |

---

## Get Tenant

```http
GET /api/admin/tenant/:tenantId
```

`protected`  `application/json`

Returns details for a specific tenant.

**Path Parameters**

| Parameter  | Description            |
|------------|------------------------|
| `tenantId` | UUID of the tenant     |

**Response**

```json
{
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Acme Corp",
    "domain": "acme.example.com",
    "allowSignUp": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses**

| Status | Description                     |
|--------|---------------------------------|
| `401`  | Missing or invalid access token |
| `403`  | Insufficient permissions        |
| `404`  | Tenant not found                |

---

## Update Tenant

```http
PATCH /api/admin/tenant/:tenantId
```

`protected`  `application/json`

Updates a tenant's name and/or signup configuration.

**Path Parameters**

| Parameter  | Description            |
|------------|------------------------|
| `tenantId` | UUID of the tenant     |

**Request Body**

```json
{
    "name": "Acme Corp Updated",
    "allowSignUp": true
}
```

| Parameter     | Required | Type    | Description                          |
|---------------|----------|---------|--------------------------------------|
| `name`        | No       | string  | New display name (max 128 chars)     |
| `allowSignUp` | No       | boolean | Enable or disable self-registration  |

**Response**

Returns the updated tenant object (same shape as Get Tenant).

**Error Responses**

| Status | Description                     |
|--------|---------------------------------|
| `400`  | Invalid request body            |
| `401`  | Missing or invalid access token |
| `403`  | Insufficient permissions        |
| `404`  | Tenant not found                |

---

## Delete Tenant

```http
DELETE /api/admin/tenant/:tenantId
```

`protected`  `application/json`

Permanently deletes a tenant and all associated data.

**Path Parameters**

| Parameter  | Description            |
|------------|------------------------|
| `tenantId` | UUID of the tenant     |

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
| `404`  | Tenant not found                |

---

## Tenant Keys

### Get Tenant Keys

```http
GET /api/admin/tenant/:tenantId/keys
```

`protected`  `application/json`

Returns the RSA key pair information for a tenant.

**Path Parameters**

| Parameter  | Description            |
|------------|------------------------|
| `tenantId` | UUID of the tenant     |

**Response**

Returns key metadata for the tenant's signing keys.

**Error Responses**

| Status | Description                     |
|--------|---------------------------------|
| `401`  | Missing or invalid access token |
| `403`  | Insufficient permissions        |
| `404`  | Tenant not found                |

### Rotate Tenant Keys

```http
PUT /api/admin/tenant/:tenantId/keys
```

`protected`  `application/json`

Generates a new RSA key pair for the tenant. Existing tokens signed with the old key remain valid until expiry.

**Path Parameters**

| Parameter  | Description            |
|------------|------------------------|
| `tenantId` | UUID of the tenant     |

**Response**

Returns the new key metadata.

**Error Responses**

| Status | Description                     |
|--------|---------------------------------|
| `401`  | Missing or invalid access token |
| `403`  | Insufficient permissions        |
| `404`  | Tenant not found                |

---

## Tenant Credentials

```http
GET /api/admin/tenant/:tenantId/credentials
```

`protected`  `application/json`

Returns the default client credentials for a tenant. The response includes `Cache-Control: no-store` to prevent
credential caching.

**Path Parameters**

| Parameter  | Description            |
|------------|------------------------|
| `tenantId` | UUID of the tenant     |

**Response**

Returns the tenant's default OAuth client credentials.

**Error Responses**

| Status | Description                     |
|--------|---------------------------------|
| `401`  | Missing or invalid access token |
| `403`  | Insufficient permissions        |
| `404`  | Tenant not found                |

---

## Member Management

### List Members

```http
GET /api/admin/tenant/:tenantId/members
```

`protected`  `application/json`

Returns all members of the specified tenant, including their roles.

**Path Parameters**

| Parameter  | Description            |
|------------|------------------------|
| `tenantId` | UUID of the tenant     |

**Response**

Array of member objects (same shape as [Member Management API list](member-management-api.md#list-members)).

### Get Member

```http
GET /api/admin/tenant/:tenantId/member/:userId
```

`protected`  `application/json`

Returns details for a specific member, including their assigned roles.

**Path Parameters**

| Parameter  | Description            |
|------------|------------------------|
| `tenantId` | UUID of the tenant     |
| `userId`   | UUID of the user       |

**Response**

Member detail object with tenant context and roles.

### Get Member Roles

```http
GET /api/admin/tenant/:tenantId/member/:userId/roles
```

`protected`  `application/json`

Returns only the roles assigned to a specific member.

**Path Parameters**

| Parameter  | Description            |
|------------|------------------------|
| `tenantId` | UUID of the tenant     |
| `userId`   | UUID of the user       |

**Response**

Array of role objects assigned to the user within this tenant.

### Set Member Roles

```http
PUT /api/admin/tenant/:tenantId/member/:userId/roles
```

`protected`  `application/json`

Replaces all roles for a member. The provided role list becomes the complete set of roles — any roles not in the list
are removed.

**Path Parameters**

| Parameter  | Description            |
|------------|------------------------|
| `tenantId` | UUID of the tenant     |
| `userId`   | UUID of the user       |

**Request Body**

```json
{
    "roles": ["TENANT_ADMIN", "reviewer"]
}
```

| Parameter | Required | Type     | Description                                     |
|-----------|----------|----------|-------------------------------------------------|
| `roles`   | Yes      | string[] | Complete list of role names to assign           |

**Response**

Returns the updated member with the new role assignments.

### Add Members

```http
POST /api/admin/tenant/:tenantId/members/add
```

`protected`  `application/json`

Adds users to a tenant by email address. Shadow accounts are created if the email does not exist.

**Path Parameters**

| Parameter  | Description            |
|------------|------------------------|
| `tenantId` | UUID of the tenant     |

**Request Body**

```json
{
    "emails": ["alice@example.com", "bob@example.com"]
}
```

| Parameter | Required | Type     | Description                             |
|-----------|----------|----------|-----------------------------------------|
| `emails`  | Yes      | string[] | Emails to add (max 128 chars each)      |

**Response**

Returns the updated tenant object.

### Remove Members

```http
DELETE /api/admin/tenant/:tenantId/members/delete
```

`protected`  `application/json`

Removes users from a tenant by email address. User accounts are not deleted.

**Path Parameters**

| Parameter  | Description            |
|------------|------------------------|
| `tenantId` | UUID of the tenant     |

**Request Body**

```json
{
    "emails": ["bob@example.com"]
}
```

| Parameter | Required | Type     | Description                             |
|-----------|----------|----------|-----------------------------------------|
| `emails`  | Yes      | string[] | Emails to remove (max 128 chars each)   |

**Response**

Returns the updated tenant object.

---

## App-Owned Role Management

> See [App-Owned Roles](app-owned-roles.md) for the architecture overview.

### Get Member App Roles

```http
GET /api/admin/tenant/:tenantId/member/:userId/app-roles
```

`protected`  `application/json`

Returns all app-owned roles assigned to the user within this tenant.

**Path Parameters**

| Parameter  | Description            |
|------------|------------------------|
| `tenantId` | UUID of the tenant     |
| `userId`   | UUID of the user       |

### Add Member App Roles

```http
POST /api/admin/tenant/:tenantId/member/:userId/app-roles/add
```

`protected`  `application/json`

Assigns app-owned roles to a member.

**Path Parameters**

| Parameter  | Description            |
|------------|------------------------|
| `tenantId` | UUID of the tenant     |
| `userId`   | UUID of the user       |

**Request Body**

```json
{
    "roleNames": ["todo-app:editor", "crm-app:viewer"]
}
```

| Parameter   | Required | Type     | Description                                                    |
|-------------|----------|----------|----------------------------------------------------------------|
| `roleNames` | Yes      | string[] | App role names in `{clientAlias}:{roleName}` format            |

### Remove Member App Roles

```http
DELETE /api/admin/tenant/:tenantId/member/:userId/app-roles/remove
```

`protected`  `application/json`

Removes app-owned roles from a member.

**Path Parameters**

| Parameter  | Description            |
|------------|------------------------|
| `tenantId` | UUID of the tenant     |
| `userId`   | UUID of the user       |

**Request Body**

```json
{
    "roleNames": ["todo-app:editor"]
}
```

| Parameter   | Required | Type     | Description                                                    |
|-------------|----------|----------|----------------------------------------------------------------|
| `roleNames` | Yes      | string[] | App role names in `{clientAlias}:{roleName}` format            |

### Get Available App Roles

```http
GET /api/admin/tenant/:tenantId/app-roles/available
```

`protected`  `application/json`

Returns all app-owned roles available to the tenant based on its app subscriptions.

**Path Parameters**

| Parameter  | Description            |
|------------|------------------------|
| `tenantId` | UUID of the tenant     |

---

## Role Management

### List Tenant Roles

```http
GET /api/admin/tenant/:tenantId/roles
```

`protected`  `application/json`

Returns all roles defined in the tenant.

**Path Parameters**

| Parameter  | Description            |
|------------|------------------------|
| `tenantId` | UUID of the tenant     |

### Create Role

```http
POST /api/admin/tenant/:tenantId/role/:name
```

`protected`  `application/json`

Creates a new role for the tenant.

**Path Parameters**

| Parameter  | Description              |
|------------|--------------------------|
| `tenantId` | UUID of the tenant       |
| `name`     | Name for the new role    |

### Delete Role

```http
DELETE /api/admin/tenant/:tenantId/role/:name
```

`protected`  `application/json`

Deletes a role from the tenant.

**Path Parameters**

| Parameter  | Description              |
|------------|--------------------------|
| `tenantId` | UUID of the tenant       |
| `name`     | Name of the role to delete |

---

## Groups

### List Tenant Groups

```http
GET /api/admin/tenant/:tenantId/groups
```

`protected`  `application/json`

Returns all groups defined in the tenant.

**Path Parameters**

| Parameter  | Description            |
|------------|------------------------|
| `tenantId` | UUID of the tenant     |

---

## Clients

### List Tenant Clients

```http
GET /api/admin/tenant/:tenantId/clients
```

`protected`  `application/json`

Returns all OAuth client registrations for the tenant.

**Path Parameters**

| Parameter  | Description            |
|------------|------------------------|
| `tenantId` | UUID of the tenant     |

---

## App Subscriptions

### Get Apps Created by Tenant

```http
GET /api/admin/tenant/:tenantId/apps/created
```

`protected`  `application/json`

Returns all apps created by the tenant (where the tenant is the app publisher).

### Get Tenant Subscriptions

```http
GET /api/admin/tenant/:tenantId/apps/subscriptions
```

`protected`  `application/json`

Returns all apps the tenant is subscribed to.

### Subscribe Tenant to App

```http
POST /api/admin/tenant/:tenantId/apps/:appId/subscribe
```

`protected`  `application/json`

Subscribes a tenant to an app.

**Path Parameters**

| Parameter  | Description            |
|------------|------------------------|
| `tenantId` | UUID of the tenant     |
| `appId`    | UUID of the app        |

### Unsubscribe Tenant from App

```http
POST /api/admin/tenant/:tenantId/apps/:appId/unsubscribe
```

`protected`  `application/json`

Removes a tenant's subscription to an app.

**Path Parameters**

| Parameter  | Description            |
|------------|------------------------|
| `tenantId` | UUID of the tenant     |
| `appId`    | UUID of the app        |
