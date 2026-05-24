# Role Management API

## Overview

The Role Management API provides endpoints for defining and managing roles within a tenant. Roles are used for
authorization — they determine what actions a user can perform. Each role can have policies (permissions) attached to it
via the [Policy Management API](policy-management-api.md).

Roles come in three types:

| Type          | Description                                                             |
|---------------|-------------------------------------------------------------------------|
| Internal      | Built-in roles (`SUPER_ADMIN`, `TENANT_ADMIN`, `TENANT_VIEWER`) — cannot be created or deleted via this API |
| Tenant-local  | Custom roles defined within a tenant (e.g., `reviewer`, `developer`)    |
| App-owned     | Roles defined by a subscribed app (e.g., `todo-app:editor`) — see [App-Owned Roles](app-owned-roles.md) |

**Base path:** `/api`

---

## Authentication

All endpoints require an `Authorization` header with a valid Bearer token:

```http
Authorization: Bearer <access_token>
```

The tenant context is derived from the token's `tenant` claim for `/tenant/my/*` endpoints.

---

## Roles and Permissions

| Role           | Permissions                                                                       |
|----------------|-----------------------------------------------------------------------------------|
| `TENANT_ADMIN` | Create and delete tenant-local roles; update any role's description               |
| `TENANT_VIEWER`| List and get roles (read-only)                                                    |

---

## List My Tenant Roles

```http
GET /api/tenant/my/roles
```

`protected`  `application/json`

Returns all roles available in the current tenant, including internal, tenant-local, and app-owned roles.

**Response**

```json
[
    {
        "id": "r1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "name": "TENANT_ADMIN",
        "description": "Tenant administrator",
        "removable": false,
        "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
        "id": "r2b2c3d4-e5f6-7890-abcd-ef1234567890",
        "name": "reviewer",
        "description": "Can review content",
        "removable": true,
        "createdAt": "2024-01-15T10:00:00.000Z"
    }
]
```

| Field        | Type    | Description                                           |
|--------------|---------|-------------------------------------------------------|
| `id`         | string  | UUID of the role                                      |
| `name`       | string  | Name of the role                                      |
| `description`| string  | Human-readable description of the role                |
| `removable`  | boolean | `false` for internal roles; `true` for custom roles   |
| `createdAt`  | string  | ISO 8601 timestamp of role creation                   |

**Error Responses**

| Status | Description                         |
|--------|-------------------------------------|
| `401`  | Missing or invalid access token     |
| `403`  | Insufficient permissions            |

---

## Get Role

```http
GET /api/tenant/my/role/:name
```

`protected`  `application/json`

Returns details for a specific role by name.

**Path Parameters**

| Parameter | Description              |
|-----------|--------------------------|
| `name`    | Name of the role         |

**Response**

Single role object (same shape as list item above).

**Error Responses**

| Status | Description                     |
|--------|---------------------------------|
| `401`  | Missing or invalid access token |
| `403`  | Insufficient permissions        |
| `404`  | Role not found                  |

---

## Create Role

```http
POST /api/tenant/my/role/:name
```

`protected`  `application/json`

Creates a new tenant-local role.

**Path Parameters**

| Parameter | Description                            |
|-----------|----------------------------------------|
| `name`    | Name for the new role (max 20 chars)   |

**Response**

Returns the created role object.

**Error Responses**

| Status | Description                     |
|--------|---------------------------------|
| `400`  | Role name invalid or in use     |
| `401`  | Missing or invalid access token |
| `403`  | Insufficient permissions        |

---

## Delete Role

```http
DELETE /api/tenant/my/role/:name
```

`protected`  `application/json`

Deletes a tenant-local role. Cannot delete internal roles (`SUPER_ADMIN`, `TENANT_ADMIN`, `TENANT_VIEWER`) or roles
still assigned to members.

**Path Parameters**

| Parameter | Description                        |
|-----------|------------------------------------|
| `name`    | Name of the role to delete         |

**Response**

```json
{
    "success": true
}
```

**Error Responses**

| Status | Description                                  |
|--------|----------------------------------------------|
| `400`  | Role is internal or still assigned to users  |
| `401`  | Missing or invalid access token              |
| `403`  | Insufficient permissions                     |
| `404`  | Role not found                               |

---

## Get Role by ID

```http
GET /api/role/:roleId
```

`protected`  `application/json`

Returns details for a specific role by UUID.

**Path Parameters**

| Parameter | Description         |
|-----------|---------------------|
| `roleId`  | UUID of the role    |

**Response**

Single role object with full details including associated policies.

---

## Update Role

```http
PATCH /api/role/:roleId
```

`protected`  `application/json`

Updates a role's name, description, or app association.

**Path Parameters**

| Parameter | Description         |
|-----------|---------------------|
| `roleId`  | UUID of the role    |

**Request Body**

```json
{
    "name": "senior-reviewer",
    "description": "Senior content reviewer with elevated privileges",
    "appId": null
}
```

| Parameter     | Required | Type   | Description                                              |
|---------------|----------|--------|----------------------------------------------------------|
| `name`        | No       | string | New name for the role                                    |
| `description` | No       | string | New description                                          |
| `appId`       | No       | string\|null | App UUID for app-owned roles; `null` for tenant-local |

**Response**

Returns the updated role object.

**Error Responses**

| Status | Description                     |
|--------|---------------------------------|
| `400`  | Invalid name or description     |
| `401`  | Missing or invalid access token |
| `403`  | Insufficient permissions        |
| `404`  | Role not found                  |
