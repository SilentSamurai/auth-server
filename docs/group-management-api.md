# Group Management API

## Overview

The Group Management API provides endpoints for creating and managing groups of users within a tenant. Groups can have
roles assigned to them, and users can be added to or removed from groups. When roles are assigned to a group, all
members of that group inherit those roles.

**Base path:** `/api`

---

## Authentication

All endpoints require an `Authorization` header with a valid Bearer token:

```http
Authorization: Bearer <access_token>
```

The tenant context is derived from the token's `tenant` claim.

---

## Roles and Permissions

| Role           | Permissions                                                   |
|----------------|---------------------------------------------------------------|
| `TENANT_ADMIN` | Full group management (create, update, delete, manage roles and users) |
| `TENANT_VIEWER`| Can list groups only                                          |

---

## List My Tenant Groups

```http
GET /api/tenant/my/groups
```

`protected`  `application/json`

Returns all groups defined in the current tenant.

**Response**

```json
[
    {
        "id": "g1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "name": "Engineering",
        "tenantId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "roles": [
            {
                "id": "r1b2c3d4-e5f6-7890-abcd-ef1234567890",
                "name": "developer",
                "description": "Developer role"
            }
        ],
        "users": [
            {
                "id": "u1b2c3d4-e5f6-7890-abcd-ef1234567890",
                "email": "alice@example.com",
                "name": "Alice Smith"
            }
        ],
        "createdAt": "2024-01-15T10:00:00.000Z"
    }
]
```

| Field            | Type    | Description                                |
|------------------|---------|--------------------------------------------|
| `id`             | string  | UUID of the group                          |
| `name`           | string  | Display name of the group                  |
| `tenantId`       | string  | UUID of the tenant                         |
| `roles`          | array   | Roles assigned to this group               |
| `roles[].name`   | string  | Name of a role assigned to the group       |
| `users`          | array   | Users who are members of this group        |
| `users[].email`  | string  | Email of a group member                    |
| `createdAt`      | string  | ISO 8601 timestamp of group creation       |

**Error Responses**

| Status | Description                         |
|--------|-------------------------------------|
| `401`  | Missing or invalid access token     |
| `403`  | Insufficient permissions            |

---

## Create Group

```http
POST /api/group/create
```

`protected`  `application/json`

Creates a new group within a tenant.

**Request Body**

```json
{
    "name": "Engineering",
    "tenantId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

| Parameter  | Required | Type   | Description                                    |
|------------|----------|--------|------------------------------------------------|
| `name`     | Yes      | string | Name for the new group                         |
| `tenantId` | Yes      | string | UUID of the tenant to create the group in      |

**Response**

Returns the created group object.

**Error Responses**

| Status | Description                     |
|--------|---------------------------------|
| `400`  | Invalid request body            |
| `401`  | Missing or invalid access token |
| `403`  | Insufficient permissions        |

---

## Get Group

```http
GET /api/group/:groupId
```

`protected`  `application/json`

Returns details for a specific group, including assigned roles and members.

**Path Parameters**

| Parameter | Description            |
|-----------|------------------------|
| `groupId` | UUID of the group      |

**Response**

Returns the group object with roles and users arrays.

**Error Responses**

| Status | Description                     |
|--------|---------------------------------|
| `401`  | Missing or invalid access token |
| `403`  | Insufficient permissions        |
| `404`  | Group not found                 |

---

## Update Group

```http
PATCH /api/group/:groupId/update
```

`protected`  `application/json`

Updates a group's name.

**Path Parameters**

| Parameter | Description            |
|-----------|------------------------|
| `groupId` | UUID of the group      |

**Request Body**

```json
{
    "name": "Engineering Team"
}
```

| Parameter | Required | Type   | Description            |
|-----------|----------|--------|------------------------|
| `name`    | Yes      | string | New name for the group |

**Response**

Returns the updated group object.

**Error Responses**

| Status | Description                     |
|--------|---------------------------------|
| `400`  | Invalid request body            |
| `401`  | Missing or invalid access token |
| `403`  | Insufficient permissions        |
| `404`  | Group not found                 |

---

## Delete Group

```http
DELETE /api/group/:groupId/delete
```

`protected`  `application/json`

Permanently deletes a group. Users are not deleted — only the group membership is removed.

**Path Parameters**

| Parameter | Description            |
|-----------|------------------------|
| `groupId` | UUID of the group      |

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
| `404`  | Group not found                 |

---

## Manage Group Roles

### Add Roles to Group

```http
POST /api/group/:groupId/add-roles
```

`protected`  `application/json`

Assigns roles to a group. All members inherit the group's roles.

**Path Parameters**

| Parameter | Description            |
|-----------|------------------------|
| `groupId` | UUID of the group      |

**Request Body**

```json
{
    "roles": ["developer", "reviewer"]
}
```

| Parameter | Required | Type     | Description                          |
|-----------|----------|----------|--------------------------------------|
| `roles`   | Yes      | string[] | Role names to assign to the group    |

**Response**

Returns the updated group object.

### Remove Roles from Group

```http
POST /api/group/:groupId/remove-roles
```

`protected`  `application/json`

Removes roles from a group.

**Path Parameters**

| Parameter | Description            |
|-----------|------------------------|
| `groupId` | UUID of the group      |

**Request Body**

```json
{
    "roles": ["developer"]
}
```

| Parameter | Required | Type     | Description                            |
|-----------|----------|----------|----------------------------------------|
| `roles`   | Yes      | string[] | Role names to remove from the group    |

**Response**

Returns the updated group object.

---

## Manage Group Users

### Add Users to Group

```http
POST /api/group/:groupId/add-users
```

`protected`  `application/json`

Adds users to a group by user ID. They inherit all roles assigned to the group.

**Path Parameters**

| Parameter | Description            |
|-----------|------------------------|
| `groupId` | UUID of the group      |

**Request Body**

```json
{
    "users": ["u1b2c3d4-e5f6-7890-abcd-ef1234567890", "u2b2c3d4-e5f6-7890-abcd-ef1234567890"]
}
```

| Parameter | Required | Type     | Description                   |
|-----------|----------|----------|-------------------------------|
| `users`   | Yes      | string[] | User UUIDs to add to the group |

**Response**

Returns the updated group object.

### Remove Users from Group

```http
POST /api/group/:groupId/remove-users
```

`protected`  `application/json`

Removes users from a group.

**Path Parameters**

| Parameter | Description            |
|-----------|------------------------|
| `groupId` | UUID of the group      |

**Request Body**

```json
{
    "users": ["u1b2c3d4-e5f6-7890-abcd-ef1234567890"]
}
```

| Parameter | Required | Type     | Description                        |
|-----------|----------|----------|------------------------------------|
| `users`   | Yes      | string[] | User UUIDs to remove from the group |

**Response**

Returns the updated group object.
