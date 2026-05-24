# Tenant Bits API

## Overview

The Tenant Bits API provides a simple cross-tenant key-value storage mechanism. It allows applications to store and
retrieve configuration data scoped to a specific tenant, enabling app-specific settings without requiring a dedicated
database.

Common use cases include storing per-tenant feature flags, app configuration values, and integration metadata.

**Base path:** `/api/tenant-bits`

---

## Authentication

All endpoints require an `Authorization` header with a valid Bearer token:

```http
Authorization: Bearer <access_token>
```

---

## Roles and Permissions

| Role           | Permissions                   |
|----------------|-------------------------------|
| `TENANT_ADMIN` | Full read/write access        |
| `TENANT_VIEWER`| Read-only access              |

---

## Set or Update Value

```http
POST /api/tenant-bits
```

`protected`  `application/json`

Creates or updates a key-value pair for a tenant. If the key already exists for the tenant, its value is overwritten.

**Request Body**

```json
{
    "tenantId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "key": "feature-flags",
    "value": "{\"darkMode\":true,\"betaFeatures\":false}"
}
```

| Parameter  | Required | Type   | Description                                      |
|------------|----------|--------|--------------------------------------------------|
| `tenantId` | Yes      | string | UUID of the tenant to store the value for        |
| `key`      | Yes      | string | Key name for the configuration entry             |
| `value`    | Yes      | string | Value to store (arbitrary string; serialize JSON if needed) |

**Response**

```json
{
    "success": true
}
```

**Error Responses**

| Status | Description                     |
|--------|---------------------------------|
| `400`  | Invalid request body            |
| `401`  | Missing or invalid access token |
| `403`  | Insufficient permissions        |

---

## Get Value

```http
GET /api/tenant-bits?tenantId={tenantId}&key={key}
```

`protected`  `application/json`

Retrieves the value for a given tenant and key.

**Query Parameters**

| Parameter  | Required | Type   | Description                               |
|------------|----------|--------|-------------------------------------------|
| `tenantId` | Yes      | string | UUID of the tenant to read from           |
| `key`      | Yes      | string | Key name to retrieve                      |

**Response**

```json
{
    "tenantId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "key": "feature-flags",
    "value": "{\"darkMode\":true,\"betaFeatures\":false}"
}
```

**Error Responses**

| Status | Description                     |
|--------|---------------------------------|
| `400`  | Missing query parameters        |
| `401`  | Missing or invalid access token |
| `403`  | Insufficient permissions        |
| `404`  | No value found for the given key |

---

## Check if Key Exists

```http
GET /api/tenant-bits/exists?tenantId={tenantId}&key={key}
```

`protected`  `application/json`

Checks whether a key exists for a tenant without returning the value.

**Query Parameters**

| Parameter  | Required | Type   | Description                               |
|------------|----------|--------|-------------------------------------------|
| `tenantId` | Yes      | string | UUID of the tenant to check               |
| `key`      | Yes      | string | Key name to check for                     |

**Response**

```json
{
    "exists": true
}
```

| Field    | Type    | Description              |
|----------|---------|--------------------------|
| `exists` | boolean | Whether the key exists   |

---

## Delete Value

```http
DELETE /api/tenant-bits
```

`protected`  `application/json`

Deletes a key-value pair for a tenant.

**Request Body**

```json
{
    "tenantId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "key": "feature-flags"
}
```

| Parameter  | Required | Type   | Description                               |
|------------|----------|--------|-------------------------------------------|
| `tenantId` | Yes      | string | UUID of the tenant to delete from         |
| `key`      | Yes      | string | Key name to delete                        |

**Response**

```json
{
    "success": true
}
```

**Error Responses**

| Status | Description                     |
|--------|---------------------------------|
| `400`  | Invalid request body            |
| `401`  | Missing or invalid access token |
| `403`  | Insufficient permissions        |
| `404`  | Key not found                   |
