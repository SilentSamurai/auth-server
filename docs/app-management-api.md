# App Management API

## Overview

The App Management API provides endpoints for creating, managing, and subscribing to applications. Apps represent
external services that integrate with the auth server, potentially across multiple subscriber tenants. Apps can define
their own roles (see [App-Owned Roles](app-owned-roles.md)) and offer onboarding flows for new tenants.

**Base path:** `/api/apps`

---

## Authentication

All endpoints require an `Authorization` header with a valid Bearer token:

```http
Authorization: Bearer <access_token>
```

---

## Roles and Permissions

| Role            | Permissions                                                                         |
|-----------------|-------------------------------------------------------------------------------------|
| `TENANT_ADMIN`  | Create, update, delete, publish apps; manage subscriptions; onboard customers        |
| `TENANT_VIEWER` | View app details and subscriptions (read-only)                                      |

---

## Create App

```http
POST /api/apps/create
```

`protected`  `application/json`

Creates a new application in the current tenant.

**Request Body**

```json
{
    "tenantId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Todo App",
    "alias": "todo-app",
    "appUrl": "https://todo.example.com",
    "description": "A collaborative task management application",
    "onboardingEnabled": true,
    "onboardingCallbackUrl": "https://todo.example.com/api/onboard"
}
```

| Parameter               | Required | Type    | Description                                                      |
|-------------------------|----------|---------|------------------------------------------------------------------|
| `tenantId`              | Yes      | string  | UUID of the tenant that owns this app                            |
| `name`                  | Yes      | string  | Display name of the application                                  |
| `alias`                 | Yes      | string  | Unique alias for the app (used as namespace for app-owned roles) |
| `appUrl`                | Yes      | string  | The application's URL                                            |
| `description`           | No       | string  | Description of the application                                   |
| `onboardingEnabled`     | No       | boolean | Whether tenant onboarding is enabled (default false)             |
| `onboardingCallbackUrl` | No       | string  | Webhook URL called after successful onboarding                   |

**Response**

Returns the created app object with a generated `id` and `clientId`.

**Error Responses**

| Status | Description                     |
|--------|---------------------------------|
| `400`  | Invalid request body            |
| `401`  | Missing or invalid access token |
| `403`  | Insufficient permissions        |

---

## Update App

```http
PATCH /api/apps/:appId
```

`protected`  `application/json`

Updates an application's configuration.

**Path Parameters**

| Parameter | Description         |
|-----------|---------------------|
| `appId`   | UUID of the app     |

**Request Body**

```json
{
    "name": "Todo App v2",
    "appUrl": "https://todo-v2.example.com",
    "description": "Updated description",
    "onboardingEnabled": false,
    "onboardingCallbackUrl": "https://todo-v2.example.com/api/onboard"
}
```

| Parameter               | Required | Type    | Description                              |
|-------------------------|----------|---------|------------------------------------------|
| `name`                  | No       | string  | New display name                         |
| `appUrl`                | No       | string  | New application URL                      |
| `description`           | No       | string  | New description                          |
| `onboardingEnabled`     | No       | boolean | Enable or disable tenant onboarding      |
| `onboardingCallbackUrl` | No       | string  | New onboarding webhook URL               |

**Response**

Returns the updated app object.

**Error Responses**

| Status | Description                     |
|--------|---------------------------------|
| `400`  | Invalid request body            |
| `401`  | Missing or invalid access token |
| `403`  | Insufficient permissions        |
| `404`  | App not found                   |

---

## Delete App

```http
DELETE /api/apps/:appId
```

`protected`  `application/json`

Permanently deletes an application. Existing subscriptions are removed but subscriber tenant data is not affected.

**Path Parameters**

| Parameter | Description         |
|-----------|---------------------|
| `appId`   | UUID of the app     |

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
| `404`  | App not found                   |

---

## Get App Detail

```http
GET /api/apps/:appId
```

`protected`  `application/json`

Returns full details for a specific app.

**Path Parameters**

| Parameter | Description         |
|-----------|---------------------|
| `appId`   | UUID of the app     |

**Response**

Returns the app object including its roles, subscribers count, and publish status.

---

## List My Created Apps

```http
GET /api/apps/my/created
```

`protected`  `application/json`

Returns all apps created by the current tenant.

**Response**

Array of app objects that the current tenant owns.

---

## List My Available Apps

```http
GET /api/apps/my/available
```

`protected`  `application/json`

Returns all published apps from other tenants that are available for subscription by the current tenant.

**Response**

Array of published app objects from other tenants.

---

## Subscription Management

### Subscribe to App

```http
POST /api/apps/:appId/my/subscribe
```

`protected`  `application/json`

Subscribes the current tenant to an app. Once subscribed, the tenant can assign the app's roles to its members.

**Path Parameters**

| Parameter | Description         |
|-----------|---------------------|
| `appId`   | UUID of the app     |

**Response**

Returns the subscription object.

### Unsubscribe from App

```http
POST /api/apps/:appId/my/unsubscribe
```

`protected`  `application/json`

Removes the current tenant's subscription to an app. App-owned roles assigned to members within the tenant are also
removed.

**Path Parameters**

| Parameter | Description         |
|-----------|---------------------|
| `appId`   | UUID of the app     |

**Response**

```json
{
    "success": true
}
```

### List My Subscriptions

```http
GET /api/apps/my/subscriptions
```

`protected`  `application/json`

Returns all apps the current tenant is subscribed to.

**Response**

Array of subscription objects with app details.

### Get All Subscribers

```http
GET /api/apps/subscriptions/:appId
```

`protected`  `application/json`

Returns all tenants subscribed to an app.

**Path Parameters**

| Parameter | Description         |
|-----------|---------------------|
| `appId`   | UUID of the app     |

**Response**

Array of subscription objects including subscriber tenant details.

---

## Publish App

```http
PATCH /api/apps/:appId/publish
```

`protected`  `application/json`

Publishes an app, making it available for other tenants to discover and subscribe to.

**Path Parameters**

| Parameter | Description         |
|-----------|---------------------|
| `appId`   | UUID of the app     |

**Response**

Returns the updated app object with published status.

---

## Test Webhook

```http
POST /api/apps/:appId/test-webhook
```

`protected`  `application/json`

Sends a test notification to the app's configured onboarding callback URL. Use this to verify that the webhook
integration works correctly before enabling onboarding for live tenants.

**Path Parameters**

| Parameter | Description         |
|-----------|---------------------|
| `appId`   | UUID of the app     |

**Response**

```json
{
    "success": true
}
```

---

## Onboard Customer

```http
POST /api/apps/:appId/onboard-customer
```

`protected`  `application/json`

Provisions a new tenant, creates an admin user, and subscribes the tenant to the app in a single operation. The app's
onboarding webhook is called after successful provisioning. See [Multi-Tenant Onboarding](multi-tenant-onboarding.md)
for the full flow description.

**Path Parameters**

| Parameter | Description         |
|-----------|---------------------|
| `appId`   | UUID of the app     |

**Request Body**

```json
{
    "tenantName": "Acme Corp",
    "tenantDomain": "acme.example.com",
    "userEmail": "admin@acme.example.com",
    "userName": "Acme Admin"
}
```

| Parameter      | Required | Type   | Description                                   |
|----------------|----------|--------|-----------------------------------------------|
| `tenantName`   | Yes      | string | Display name for the new tenant               |
| `tenantDomain` | Yes      | string | Unique domain for the new tenant              |
| `userEmail`    | No       | string | Email for the initial admin user              |
| `userName`     | No       | string | Display name for the initial admin user       |

> **Note:** If `userEmail` is provided, `userName` is also required.

**Response**

```json
{
    "tenantId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "subscriptionId": "s1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "userId": "u1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "userEmail": "admin@acme.example.com",
    "roleNames": ["todo-app:editor"]
}
```
