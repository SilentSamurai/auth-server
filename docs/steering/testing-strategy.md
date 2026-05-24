---
inclusion: fileMatch
fileMatchPattern: "**/*.spec.ts,**/*.test.ts,**/tests/**,**/cypress/**,cypress.config.*"
---

# Testing Strategy

- For the backend (`srv/`), write **integration tests** only. Do not write unit tests.
- For the UI, write **Cypress integration tests** only. Do not write any other type of test (no unit tests, no component
  tests).
- No other test types should be generated for this project.

## What This Means

### Backend Integration Tests

- Spin up the full NestJS module with real (or test) database connections.
- Send actual HTTP requests to controllers and verify the entire flow: controller -> service -> repository -> database.
- Do not mock services or repositories. Test that components work together correctly.
- This catches wiring issues, serialization problems, auth middleware behavior, and database constraints.

### Backend Test Isolation (Critical)

All backend tests under `srv/tests/` run against a **single shared NestJS server** started once by `globalSetup`. Tests
are **not isolated** from each other — they share the same database, sessions, users, and tenants.

**Rule: Every test suite must use its own dedicated tenant.** Never reuse a tenant across test suites that mutate
state (sessions, roles, user locks, etc.).

To add a new isolated tenant:

1. Add a seed entry in `srv/src/startUp.service.ts` -> `createDummyTenantAndUser()` -> `dummyTenants` array (e.g.
   `{name: "My Feature Test Tenant", domain: "my-feature-test.local", signUp: false}`).
2. In the test file, set `clientId = 'my-feature-test.local'` and `email = 'admin@my-feature-test.local'`. The password
   for all seeded admins is `admin9000`.
3. The seed logic automatically creates the admin user, tenant, default client, and enables the password grant.

`auth.server.com` (the super tenant) should only be used for setup operations that need super-admin privileges (creating
tenants, adding members). Never use it as the primary tenant for test assertions.

### Cypress Integration Tests (UI)

- Launch the UI in a real browser and interact with it as a user would (clicking, typing, navigating).
- Tests hit the running backend, verifying the full stack from the user's perspective.
- Assert on what's visible on screen, not on internal component state.
- This catches rendering issues, form flows, navigation, and frontend-backend integration problems.

## Test Setup and Infrastructure

### Backend Test Environment

- Test configuration: `srv/envs/.env.testing` — uses an **in-memory SQLite database** for speed.
- Backend tests run on port **9001** by default.
- Test infrastructure services:
  - **FakeSmtpServer** on ports 3101 (SMTP) / 3102 (HTTP API) — intercepts outgoing emails for verification
  - **TenantAppServer** on port 3103 — mock external app for integration testing

### Running Tests

| Command                        | Description                                                  |
|--------------------------------|--------------------------------------------------------------|
| `task test`                    | Run all tests (backend + UI unit)                            |
| `cd srv && npm test`           | Run backend integration tests only                           |
| `cd ui && npm test`            | Run UI unit tests (Karma/ChromeHeadless)                     |
| `cd ui && npm run e2e:test`    | Run Cypress E2E tests (starts backend + UI + external app)   |
| `task cypress:spec -- <file>`  | Run a single Cypress spec                                    |

### Backend Test Flags

When running `npm test` in `srv/`:

| Flag                      | Effect                                                       |
|---------------------------|--------------------------------------------------------------|
| `--verbose`               | Show individual test names and timing                        |
| `--silent=false`          | Disable silent mode (show console output from tests)         |
| `--maxWorkers=25%`        | Default — adjust based on machine cores                      |
| `--testPathPattern=<pat>` | Run only tests matching the given pattern                    |

Example: `cd srv && npm test -- --verbose --silent=false --testPathPattern="role"`

### Test Infrastructure Details

**Global setup** (`srv/tests/globalSetup.ts`):
- Boots the NestJS application once before all test suites
- Seeds the super tenant and dummy tenants via `StartUpService`
- Starts the FakeSmtpServer

**Global teardown** (`srv/tests/globalTeardown.ts`):
- Gracefully shuts down NestJS app and FakeSmtpServer after all suites complete

**Typed API clients** (`srv/tests/api-client/`):
- Use typed clients like `TenantClient`, `RoleClient`, `UsersClient`, `GroupClient` instead of raw HTTP calls
- Example: `const client = new TenantClient(baseUrl); await client.createTenant({ name, domain });`

### E2E Test Flow

The E2E test command (`npm run e2e:test`) uses `start-server-and-test` which:
1. Starts the backend on port 9001
2. Starts the UI on port 4200
3. Starts `external-user-app` (mock external app)
4. Waits for all services to be ready
5. Runs Cypress tests
6. Tears down all services on completion

### Adding Test Tenants

Fixture helpers like `HelperFixture.enablePasswordGrant()` simplify token acquisition for tests:

```typescript
const helper = new HelperFixture(baseUrl);
await helper.enablePasswordGrant(tenantDomain, clientId);
const token = await helper.getAccessToken(tenantDomain, email, password);
```

Each test suite should set up its own tenant in `beforeAll()` and clean up in `afterAll()` if needed. The shared
database means leftover state from one suite can pollute another — always use unique domains.

## Test Writing Guidelines

### Backend Tests

- Use `describe`/`it` blocks with descriptive names
- Test happy path first, then edge cases, then error conditions
- Verify HTTP status codes and response body shape
- Use the typed API clients for consistency
- Don't test implementation details — test behavior visible via the API
- For destructive operations (delete, revoke), verify the state change by reading back

### Cypress Tests

- Write tests from the user's perspective — log in, navigate, interact
- Do not call APIs directly from Cypress — always go through the UI
- Use `cy.visit()` to load pages and `cy.get()` / `cy.contains()` to find elements
- Keep selectors stable — prefer `data-cy` attributes over CSS class selectors
- Test the full flow: form submission -> success message -> data appearing in list pages
