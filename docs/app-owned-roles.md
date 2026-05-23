# App-Owned Roles

## Overview

App-owned roles allow applications to define roles and authorization policies in their own tenant (the owner tenant) and
have those roles apply to users across all subscriber tenants. Unlike tenant-local roles, app-owned roles are never
copied to subscriber tenants. They live exclusively in the owner tenant, and subscriber tenants reference them via the
existing `user_roles` table.

This architecture provides a single source of truth for role definitions and policies. When an app owner updates a role
or its policies, the change takes effect immediately for all subscribers — no synchronization, no drift.

---

## Role Types

The system has three categories of roles:

| Type         | `app_id` Column    | Residency         | Token Format                                         | Policy Source        |
|--------------|--------------------|-------------------|------------------------------------------------------|----------------------|
| Internal     | N/A (hardcoded)    | Auth server code  | `SUPER_ADMIN`, `TENANT_ADMIN`, `TENANT_VIEWER`       | Hardcoded CASL rules |
| Tenant-local | `null`             | Single tenant     | `roleName`                                           | User's tenant        |
| App-owned    | Set (FK to `apps`) | Owner tenant only | `{clientAlias}:{roleName}`                           | Owner tenant         |

**Internal roles** (`SUPER_ADMIN`, `TENANT_ADMIN`, `TENANT_VIEWER`) are hardcoded in the auth server's CASL ability
factory. They control access to the auth server's own endpoints and are unaffected by this feature.

**Tenant-local roles** have `app_id = null` and are scoped to a single tenant. They work exactly as before — policies
are fetched from the tenant where the role is defined.

**App-owned roles** have `app_id` set to the owning application's ID. They reside in the owner tenant
(`role.tenant_id = owner_tenant.id`) and are never copied to subscriber tenants.

---

## Role Residency

App-owned roles stay in the owner tenant permanently. When a subscriber tenant subscribes to an app, the system does
**not** copy roles or policies to the subscriber. Instead, the subscriber's `user_roles` table entries reference the
role IDs from the owner tenant directly.

```
┌─────────────────────────────┐      ┌─────────────────────────────┐
│       Owner Tenant          │      │     Subscriber Tenant       │
│                             │      │                             │
│  roles                      │      │  user_roles                 │
│  ┌────────────────────────┐ │      │  ┌────────────────────────┐ │
│  │ id: role-1             │◄┼──────┼──│ role_id: role-1        │ │
│  │ name: "editor"         │ │      │  │ user_id: user-abc      │ │
│  │ app_id: app-1          │ │      │  │ tenant_id: sub-tenant  │ │
│  │ tenant_id: owner-tenant│ │      │  └────────────────────────┘ │
│  └────────────────────────┘ │      │                             │
│                             │      │  (no roles table entries    │
│  authorization (policies)   │      │   for app-owned roles)      │
│  ┌────────────────────────┐ │      │                             │
│  │ role_id: role-1        │ │      └─────────────────────────────┘
│  │ tenant_id: owner-tenant│ │
│  │ action: "read"         │ │
│  │ subject: "Article"     │ │
│  └────────────────────────┘ │
│                             │
└─────────────────────────────┘
```

This means:

- **Updates are instant.** Change a role's policies in the owner tenant and every subscriber sees the new policies on
  their next token or permission fetch.
- **No synchronization needed.** There is no copy to keep in sync.
- **No drift.** Subscriber tenants cannot accidentally diverge from the owner's role definitions.

### What Happens When an App-Owned Role Is Deleted

If an app-owned role is deleted from the owner tenant, the system handles it gracefully:

- **Token issuance**: The deleted role is silently skipped. The user's token will not include it.
- **Policy resolution**: The deleted role is skipped during policy fetching. No error is returned.
- **`user_roles` entries**: Orphaned entries remain in subscriber tenants but have no effect. They reference a
  non-existent role and are ignored.

---

## Role Namespacing in JWT

App-owned roles are namespaced in the JWT `roles` array using the format `{clientAlias}:{roleName}`. This prevents
collisions when a user has roles from multiple apps. The client alias is globally unique and is used for lookups instead
of the app name (which is only unique within a tenant).

### Token Example

A user who is a `TENANT_ADMIN` (internal role), has a tenant-local `reviewer` role, and has app-owned roles from two
different apps would receive a token with:

```json
{
  "roles": [
    "TENANT_ADMIN",
    "reviewer",
    "client-todo-abc:editor",
    "client-todo-abc:viewer",
    "client-crm-xyz:sales-manager"
  ]
}
```

### Namespacing Rules

| Role Type    | Format                       | Example                    |
|--------------|------------------------------|----------------------------|
| Internal     | `ROLE_NAME` (no separator)   | `SUPER_ADMIN`              |
| Tenant-local | `roleName` (no separator)    | `reviewer`                 |
| App-owned    | `{clientAlias}:{roleName}`   | `client-todo-abc:editor`   |

The `:` character is the separator. Internal and tenant-local role names never contain `:`, so the presence of a colon
reliably identifies an app-owned role.

---

## Policy Resolution

App-owned role policies are served via the auth server's policy API. The auth server's own CASL ability factory is
**not involved** — it only handles internal roles for the auth server's own endpoints.

### `/my/permissions` Endpoint

```http
GET /api/v1/my/permissions
Authorization: Bearer <user_token>
```

When this endpoint processes the token's `roles` array, it separates roles by type:

1. **Internal roles** (`SUPER_ADMIN`, `TENANT_ADMIN`, `TENANT_VIEWER`) — skipped. These are handled by the auth
   server's CASL factory internally and are not returned by the policy API.
2. **Tenant-local roles** (no `:` separator) — policies are fetched from the user's current tenant using the existing
   `PolicyService.findByRole()`.
3. **App-owned roles** (contains `:` separator) — the `PolicyResolutionService` parses the app name, looks up the app
   to find the owner tenant, then fetches policies from the owner tenant where `policy.tenant_id = owner_tenant.id`.

The endpoint returns the combined set of policies from both tenant-local and app-owned roles.

### `/tenant-user/permissions` Endpoint

```http
POST /api/v1/tenant-user/permissions
Authorization: Bearer <technical_token>
Content-Type: application/json

{
  "userId": "user-uuid",
  "tenantId": "tenant-uuid"
}
```

Same resolution logic as `/my/permissions`, but queried by a technical token on behalf of a specific user. This is used
by resource servers that need to fetch policies for a user without that user's token.

### Resolution Flow

```
Token roles: ["TENANT_ADMIN", "reviewer", "client-todo-abc:editor"]

1. "TENANT_ADMIN"          → internal role, skip (handled by auth server CASL)
2. "reviewer"               → tenant-local, fetch policies from user's tenant
3. "client-todo-abc:editor" → app-owned:
                               a. Parse → alias="client-todo-abc", role="editor"
                               b. Look up client by alias → find app → owner_tenant_id
                               c. Find role "editor" in owner tenant where app_id = app.id
                               d. Fetch policies where role_id = role.id AND tenant_id = owner_tenant_id

Result: policies from step 2 + policies from step 3
```

---

## Resource Server Pattern

Resource servers do not have direct access to the auth server's database. They retrieve policies via the policy API and
enforce them locally.

### Recommended Flow

1. **User authenticates** and receives a JWT with namespaced roles.
2. **User calls the resource server** with the JWT.
3. **Resource server calls the auth server** policy API to fetch policies:
   ```http
   GET /api/v1/my/permissions
   Authorization: Bearer <user_token>
   ```
4. **Auth server resolves policies** — tenant-local from the user's tenant, app-owned from the owner tenant.
5. **Resource server receives combined policies** and builds a local CASL ability (or equivalent) to enforce them.

```
┌──────────┐     ┌──────────────────┐     ┌──────────────┐
│  Client   │────▶│  Resource Server  │────▶│  Auth Server  │
│           │     │                  │     │              │
│  JWT with │     │  1. Extract JWT  │     │  GET /api/v1 │
│  roles:   │     │  2. Call policy  │     │  /my/perms   │
│  [app:ed] │     │     API          │     │              │
│           │     │  3. Build CASL   │     │  Resolves:   │
│           │     │     ability      │     │  - tenant    │
│           │     │  4. Enforce      │     │    policies  │
│           │     │     locally      │     │  - app-owner │
│           │◀────│                  │◀────│    policies  │
└──────────┘     └──────────────────┘     └──────────────┘
```

### Policy Caching

Resource servers should cache policy responses to avoid calling the auth server on every request. A reasonable TTL
depends on how frequently policies change. Invalidate the cache when the user's token is refreshed.

---

## Subscription Lifecycle

### Subscribe

When a tenant subscribes to an app, only a subscription record is created. No roles or policies are copied.

```
Before: subscriber tenant has no connection to the app
After:  subscription record exists (subscriber_tenant_id, app_id)
        No new roles, no new policies in subscriber tenant
```

### Onboard

The onboarding endpoint (`POST /api/apps/{appId}/onboard-customer`) creates a tenant, subscription, user, and role
assignments in a single transaction. The initial user receives all app-owned roles.

```
After onboarding:
  - New tenant created
  - Subscription record created
  - User created and added to tenant_members
  - user_roles entries created (one per app-owned role, referencing owner tenant roles)
```

See [Multi-Tenant Onboarding](multi-tenant-onboarding.md) for endpoint details.

### Unsubscribe

When a tenant unsubscribes from an app, the system removes `user_roles` entries for that app's roles in the subscriber
tenant. The roles and policies remain in the owner tenant, unaffected.

```
Before: user_roles entries reference app-owned roles
After:  user_roles entries for app-owned roles are deleted
        Roles and policies in owner tenant are unchanged
        Other subscribers are unaffected
```

---

## Token Claims Reference

For the full token claims reference, see [Resource Server Verification](resource-server-verification.md). The `roles`
array is the relevant claim for app-owned roles:

| Claim   | Description                                                                       | Example                                      |
|---------|-----------------------------------------------------------------------------------|----------------------------------------------|
| `roles` | Array of role names. App-owned roles are namespaced as `{clientAlias}:{roleName}`. | `["TENANT_ADMIN", "client-todo-abc:editor"]` |

Technical tokens (`client_credentials` grant) do not have a `roles` field — there is no user context.
