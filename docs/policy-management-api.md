# Policy Management API

## Overview

The Policy Management API provides endpoints for defining authorization policies (permissions) attached to roles.
Policies use CASL-style access control with `effect`, `action`, and `subject` fields plus optional conditions.

A policy defines what actions a role can perform on what subjects. For example, a `reviewer` role might have a policy
allowing `read` action on `Document` subjects.

**Base path:** `/api/v1`

---

## Authentication

All endpoints require an `Authorization` header with a valid Bearer token:

```http
Authorization: Bearer <access_token>
```

---

## Roles and Permissions

| Role           | Permissions                                     |
|----------------|-------------------------------------------------|
| `TENANT_ADMIN` | Create, read, update, delete policies           |
| `TENANT_VIEWER`| Read policies only                              |

---

## Policy Model

| Field        | Type           | Description                                                              |
|--------------|----------------|--------------------------------------------------------------------------|
| `id`         | UUID           | Unique identifier                                                        |
| `role`       | UUID           | The role this policy applies to (foreign key to Role)                    |
| `effect`     | `allow\|deny`  | Whether this policy allows or denies the action                          |
| `action`     | `manage\|create\|read\|update\|delete` | The action being controlled          |
| `subject`    | string         | The resource type this policy applies to (e.g., `Document`, `Project`)   |
| `conditions` | object\|null   | Optional MongoDB-style conditions for fine-grained access control        |

---

## View My Permissions

### My Internal Permissions

```http
GET /api/v1/my/internal-permissions
```

`protected`  `application/json`

Returns the internal (built-in) permissions for the current user, derived from their internal roles.

**Response**

Returns the user's combined CASL ability rules.

### My Permissions

```http
GET /api/v1/my/permissions
```

`protected`  `application/json`

Returns all permissions (internal + tenant-local + app-owned) for the current user.

**Response**

Returns the user's full set of ability rules across all role types.

---

## View User Permissions

```http
POST /api/v1/tenant-user/permissions
```

`protected`  `application/json`

Returns all permissions for a specific user in the current tenant. Useful for debugging authorization issues.

**Request Body**

```json
{
    "email": "alice@example.com"
}
```

| Parameter | Required | Type   | Description                                      |
|-----------|----------|--------|--------------------------------------------------|
| `email`   | Yes      | string | Email address of the user to look up permissions |

**Response**

Returns the specified user's combined ability rules within the current tenant.

---

## Create Policy

```http
POST /api/v1/policy/create
```

`protected`  `application/json`

Creates a new authorization policy for a role.

**Request Body**

```json
{
    "role": "r1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "effect": "allow",
    "action": "read",
    "subject": "Document",
    "conditions": {
        "authorId": "${user.id}"
    }
}
```

| Parameter    | Required | Type          | Description                                                      |
|--------------|----------|---------------|------------------------------------------------------------------|
| `role`       | Yes      | UUID          | The role UUID this policy applies to                             |
| `effect`     | Yes      | `allow\|deny` | Whether the rule allows or denies access                         |
| `action`     | Yes      | string        | The action: `manage`, `create`, `read`, `update`, or `delete`   |
| `subject`    | Yes      | string        | The resource type (e.g., `Document`, `Project`, `User`)         |
| `conditions` | No       | object\|null  | Fine-grained conditions (null for no conditions)                 |

**Action Values**

| Value    | Description                                          |
|----------|------------------------------------------------------|
| `manage` | Wildcard — grants all actions on the subject         |
| `create` | Ability to create new instances of the subject       |
| `read`   | Ability to read instances of the subject             |
| `update` | Ability to modify existing instances                 |
| `delete` | Ability to delete instances                          |

**Response**

Returns the created policy object.

**Error Responses**

| Status | Description                     |
|--------|---------------------------------|
| `400`  | Invalid request body            |
| `401`  | Missing or invalid access token |
| `403`  | Insufficient permissions        |

---

## Get Policy

```http
GET /api/v1/policy/:id
```

`protected`  `application/json`

Returns details for a specific policy.

**Path Parameters**

| Parameter | Description         |
|-----------|---------------------|
| `id`      | UUID of the policy  |

**Response**

Single policy object.

**Error Responses**

| Status | Description                     |
|--------|---------------------------------|
| `401`  | Missing or invalid access token |
| `403`  | Insufficient permissions        |
| `404`  | Policy not found                |

---

## Get Policies by Role

```http
GET /api/v1/policy/byRole/:role_id
```

`protected`  `application/json`

Returns all policies attached to a specific role.

**Path Parameters**

| Parameter  | Description            |
|------------|------------------------|
| `role_id`  | UUID of the role       |

**Response**

Array of policy objects associated with the role.

---

## Update Policy

```http
PATCH /api/v1/policy/:id
```

`protected`  `application/json`

Updates an existing policy's effect, action, subject, or conditions.

**Path Parameters**

| Parameter | Description         |
|-----------|---------------------|
| `id`      | UUID of the policy  |

**Request Body**

```json
{
    "effect": "deny",
    "action": "delete",
    "subject": "Document",
    "conditions": null
}
```

| Parameter    | Required | Type          | Description                                      |
|--------------|----------|---------------|--------------------------------------------------|
| `effect`     | No       | `allow\|deny` | New effect                                       |
| `action`     | No       | string        | New action                                       |
| `subject`    | No       | string        | New subject                                      |
| `conditions` | No       | object\|null  | New conditions                                   |

**Response**

Returns the updated policy object.

**Error Responses**

| Status | Description                     |
|--------|---------------------------------|
| `400`  | Invalid request body            |
| `401`  | Missing or invalid access token |
| `403`  | Insufficient permissions        |
| `404`  | Policy not found                |

---

## Delete Policy

```http
DELETE /api/v1/policy/:id
```

`protected`  `application/json`

Permanently deletes a policy.

**Path Parameters**

| Parameter | Description         |
|-----------|---------------------|
| `id`      | UUID of the policy  |

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
| `404`  | Policy not found                |
