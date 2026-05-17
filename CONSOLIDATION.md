# Consolidation Plan — Reducing Entropy

This document tracks the technical debt reduction and consolidation
effort. The goal is to trim AI-generated bloat, eliminate redundancy,
and make the codebase more maintainable without changing external
behavior. Updated from deep-dive audit (May 2026).

---

## Diagnosis Summary

| Source | Severity | Description |
|--------|----------|-------------|
| `oauth-token.controller.ts` | High | 881 lines, 7 routes, 17 injected services — monolithic |
| Property-based tests | High | 87 files (47% of all tests), many exercising same flows |
| Dead code | High | ~~4 unused files found~~ (already deleted in Phase 0) |
| `token-issuance.service.ts` | High | 668 lines, not flagged for splitting |
| `startUp.service.ts` | High | 596 lines mixing startup logic with seed data |
| Inline DTOs scattered | Medium | 8+ controllers define Yup schemas inline; only 1 file in `dto/` |
| `roleV2.controller.ts` | Medium | V2 endpoints added alongside V1 instead of consolidating |
| `contexts.ts` mixed concerns | Medium | 277 lines merging grant types, token classes, auth context |
| `search-filter.utils.ts` misplaced | ~~Medium~~ | ~~Utility file living in `controllers/` directory~~ (moved to `util/`) |
| `GET /api/oauth/logout` defined in 2 controllers | Medium | OAuthTokenController + RevocationController — latent routing conflict |
| Dual CORS handling | Medium | Global `CorsInterceptor` (DB-driven) bypassed by `*` OPTIONS handler |
| `FakeSmtpServer.ts` in `src/mail/` | ~~Medium~~ | ~~409-line test support file inside application source~~ (moved to `tests/smtp/`) |
| Duplicate `theme.service.ts` | ~~Low~~ | ~~Byte-identical file in `_services/` and `component/theme/`~~ (resolved — duplicate deleted) |
| Inline Angular templates | Low | 114 `template:`, only 1 `templateUrl:` |
| Mirrored UI components | Medium | 18 mirror pairs found (8 claimed, 10 newly identified) |
| No barrel files | Low | All imports reference individual files directly |
| `util/` vs `utils/` | ~~Low~~ | ~~Two directories, same purpose~~ (merged into `util/`) |
| `migrations/` | Medium | 28 files (+1 registry `migrations/migrations.ts`); could be squashed to ~5 milestones |
| `OWH32` non-standard hash | Medium | Custom FNV-1a in `crypt.util.ts` bypassing RFC 7636 S256 — **actively used** as optional PKCE method |

---

## Phase 0 — Delete Dead Code ✅ COMPLETED

Zero risk, immediate payoff. All dead files were already removed from the codebase.

### 0.1 Delete unused `RoleGuard` ✅

**Status:** Done. File `srv/src/auth/role.guard.ts` no longer exists. Zero references remain.

### 0.2 Delete unused `BackendError` class ✅

**Status:** Done. File `srv/src/exceptions/backend-error.class.ts` no longer exists. Zero references remain.

### 0.3 Delete dead `JsonConsoleLogger` ✅

**Status:** Done. File `srv/src/log/JsonConsoleLogger.ts` no longer exists. No logger registration in `setup.ts` (lines 44-46 are live SMTP setup code, not logger registration).

### 0.4 Remove commented-out cluster code ✅

**Status:** N/A. `main.ts` is 8 lines with no commented-out code. No cluster code ever existed in this file.

### 0.5 Remove empty `static {}` block ✅

**Status:** N/A. `http-exception.filter.ts` has a `static exceptionResolver` Map (line 15) but no `static {}` block. The static field is initialized to an empty Map — intentional, not dead code.

### 0.6 Delete empty `test-utils/` directory ✅

**Status:** N/A. `srv/src/test-utils/` directory does not exist.

---

## Phase 1 — Quick Wins ✅ COMPLETED

Low risk, high consistency gain. Can be done in any order.

### 1.1 Merge `util/` + `utils/` into single `util/` directory ✅

**Status:** Done. `srv/src/utils/` no longer exists. All utility files now live in `srv/src/util/` (6 files). Imports in `app.service.ts` updated.

### 1.2 Remove duplicate `theme.service.ts` ✅

**Status:** Done. `ui/src/app/_services/theme.service.ts` deleted. Zero stale imports remain.

### 1.3 Add barrel files ✅

**Status:** Done. Barrel files (`index.ts`) already existed in all four directories (`controllers/`, `services/`, `auth/`, `entity/`) and were comprehensive. Added `RoleEnum` export to `entity/index.ts` to complete coverage.

### 1.4 Move `search-filter.utils.ts` to `util/` ✅

**Status:** Done. Now at `srv/src/util/search-filter.utils.ts`. Import in `generic-search.controller.ts` updated.

### 1.5 Fix `SubjectEnum.APPS` naming inconsistency ✅

**Status:** Done. `SubjectEnum` uses `APP` (singular). Zero references to `APPS` remain.

### 1.6 Remove unused `CorsInterceptor` provider registration ✅

**Status:** Done. Removed `CorsInterceptor` from `providers` and `exports` in `srv/src/services/service.module.ts`. The global registration in `setup.ts` (L89-90) remains intact — this was the intended single point of registration.

### 1.7 Move `FakeSmtpServer.ts` from `src/mail/` to `tests/` ✅

**Status:** Done. Now at `srv/tests/smtp/FakeSmtpServer.ts`. All imports updated.

### 1.8 Organize orphaned root test support files ✅

**Status:** Done. `fetch-utils.ts` → `api-client/`, `smtp-client-adapter.ts` → `smtp/`, `webhook-client-adapter.ts` → `api-client/`. `test-ports.ts` intentionally stays at root.

---

## Phase 2 — Structural Consolidation

Medium effort, clear architectural benefit.

### 2.1 Break up `oauth-token.controller.ts` ✅

**Status:** Done. Split the 881-line monolith into 4 focused controllers + shared `SessionHelperService`:

| Controller | Routes | Est. Lines | Key Services |
|---|---|---|---|
| `AuthorizeController` | GET /authorize, POST /login | ~238 | AuthorizeService, AuthService, LoginSessionService, FlowIdCookieService, CsrfTokenService, ClientService, ScopeResolverService, ConsentService, FirstPartyResolver, TenantAmbiguityService |
| `TokenController` | POST /token, POST /exchange | ~293 | AuthService, AuthCodeService, TokenIssuanceService, ClientService, RefreshTokenService, CorsOriginService |
| `SessionController` | GET /session-info, GET /logout | ~61 | LoginSessionService, AuthUserService |
| `ConsentController` | POST /consent | ~74 | ConsentService, ScopeResolverService, CsrfTokenService, LoginSessionService, ClientService |

**Shared helpers** (`resolveSession()`, `issueCodeAndRedirect()`, `redirectToAuthorizeUI()`, `redirectWithError()`, `getSidCookieOptions()`) moved to `auth/session-helper.service.ts`.

**Conflict resolved:** Removed `@Get('logout')` from `RevocationController` (was returning 405, shadowing the RP-Initiated Logout redirect). The `SessionController` now owns `GET /logout` for RP-Initiated Logout; `RevocationController` only handles `POST /logout`.

### 2.2 Merge `roleV2.controller.ts` into `role.controller.ts`

**V1 routes** (`@Controller("api/tenant")`):
- `POST /api/tenant/my/role/:name` — create role
- `DELETE /api/tenant/my/role/:name` — delete role
- `GET /api/tenant/my/roles` — list roles
- `GET /api/tenant/my/role/:name` — get role by name

**V2 routes** (`@Controller("api/role")`):
- `PATCH /api/role/:roleId` — update role description
- `GET /api/role/:roleId` — get role by ID

**Files affected:**
- Add PATCH + GET-by-ID routes to `role.controller.ts`
- Change `RoleController` prefix from `api/tenant` to `api` and adjust V1 paths to `/tenant/my/...`
- Create shared private helper `_getRoleWithUsers()` to deduplicate the get-role-by-name (V1) and get-role-by-ID (V2) logic
- Copy static `UpdateRoleSchema` to `RoleController`
- Add missing imports (`Body`, `Patch`, `ValidationPipe`)
- Delete `roleV2.controller.ts`
- Remove `RoleControllerV2` import from `controller.module.ts`

**Risk:** Low. Routes don't overlap. Same 4 injected services in both controllers.

### 2.3 Split `token-issuance.service.ts` (668 lines)

**Proposed split:**
- `TokenClaimsService` — claim assembly, scope resolution, claim validation
- `TokenSigningService` — JWT signing, key selection, kid header
- `TokenIssuanceService` — orchestration (keeps the coordination logic)

**Risk:** Medium. Needs careful dependency analysis to avoid circular imports.

### 2.4 Split `startUp.service.ts` (596 lines)

Separate seed/test data logic from application startup:
- `startUp.service.ts` — bootstrapping only (validate env, run startup checks)
- `seed.service.ts` — `createDummyTenantAndUser()`, `dummyTenants` array, test tenant creation

**Risk:** Low. Seed data is only used in development/testing.

### 2.5 Split `contexts.ts` (277 lines, located at `srv/src/casl/contexts.ts`)

**Proposed split:**
- `casl/token-types.ts` — `Token`, `TenantToken`, `TechnicalToken`, `InternalToken` classes, `TenantTokenParams`, `TechnicalTokenParams` interfaces
- `casl/grant-types.ts` — `GRANT_TYPES` enum
- `casl/auth-context.ts` — `AuthContext` class, `TenantInfo` interface

**Risk:** Low. Pure extraction, no behavioral change.

### 2.6 DTO Standardization

Extract all inline Yup schemas from controllers into `srv/src/dto/`:

| Current location | Inline schema | Target file |
|---|---|---|
| `admin-tenant.controller.ts` | `UpdateTenantSchema`, `MemberOperationSchema` | `dto/tenant.dto.ts` |
| `admin-tenant.controller.ts` | (uses shared `ValidationSchema.OperatingRoleSchema`) | `dto/tenant.dto.ts` |
| `policy.controller.ts` | `CreateSchema`, `UpdateSchema` | `dto/policy.dto.ts` |
| `registration.controller.ts` | `RegisterDomainSchema`, `SignUpSchema` | `dto/registration.dto.ts` |
| `members.controller.ts` | `MemberOperationSchema` | `dto/tenant.dto.ts` |
| `users.admin.controller.ts` | `VerifyUserSchema`, `UpdateUserPasswordSchema` | `dto/user.dto.ts` |
| `tenant.controller.ts` | `UpdateTenantSchema` | `dto/tenant.dto.ts` |
| `roleV2.controller.ts` | `UpdateRoleSchema` | `dto/role.dto.ts` |

Also break up `validation/validation.schema.ts` (410 lines) into per-domain files under `dto/`.

**Risk:** Low. Pure extraction; all imports update to point to new paths.

---

## Phase 3 — Test Consolidation

### 3.1 Consolidate property-based test files

**Verified grouping — no duplicate invariant testing found** (each file tests a unique property), but files can be merged by feature domain:

| Domain | Current Files | Target |
|---|---|---|
| Consent tracking | `consent-version-tracks-mutations`, `consent-required-iff-scopes-exceed`, `consent-missing-always-required`, `consent-grant-produces-union`, `consent-narrower-no-modify` (5 files) | `consent-properties.spec.ts` |
| Redirect URI | `redirect-uri-exact-match`, `redirect-uri-roundtrip`, `redirect-uri-binding`, `redirect-uri-no-leak`, `redirect-url-construction` (5 files) | `redirect-uri-properties.spec.ts` |
| PKCE | `pkce-verifier-format-validation`, `pkce-s256-roundtrip`, `pkce-s256-cross-impl`, `pkce-verifier-generation`, `pkce-optional-flow`, `pkce-enforcement` (6 files) | `pkce-properties.spec.ts` |
| Refresh token | 12 contiguous property files (1-12) | `refresh-token-properties.spec.ts` |
| Token claims | `token-required-claims` through `token-tenant-retained` (9 files, Properties 1-9) | `token-claims-properties.spec.ts` |

### 3.2 Fix duplicate Property 6

`token-scope-role-disjoint.property.spec.ts` and `tokens-contain-only-oauth-scopes.property.spec.ts` both claim to be **Feature: scope-model-refactoring, Property 6** with nearly identical descriptions. The only difference: the latter also covers `TechnicalToken` (no roles field). Merge into one file.

### 3.3 Organize `properties/` into subdirectories

Current: 87 files flat. Proposed structure:
- `properties/unit/` — pure fast-check tests (no NestJS app bootstrap)
- `properties/integration/` — tests requiring NestJS app context

**Risk:** Low. Mechanical move, imports unchanged due to relative paths within tests.

### 3.4 Fix `apps_&_subscription` directory name

Rename `srv/tests/apps_&_subscription/` → `srv/tests/apps-and-subscription/` (ampersand in directory name causes shell issues).

### 3.5 API Client inventory corrections

| Client | Doc Claims | Actual |
|---|---|---|
| `TenantClient` | 249 lines | 201 lines |
| `RoleClient` | 19 lines | 15 lines |
| `client.ts` | **not listed** | 42 lines (add to inventory) |

No consolidation pressure on API clients; structure is reasonable.

---

## Phase 4 — UI Consolidation

### 4.1 Externalize inline templates

Move backtick-string templates to `.html` files and inline styles to `.scss`.
This affects **114 TypeScript files** with inline templates (only 1 uses `templateUrl`).

**Approach:**
1. New file per component: `foo.component.html`, `foo.component.scss`
2. Update `@Component({ template: `...` })` → `templateUrl: './foo.component.html'`
3. Add `styleUrls` if styles exist in the TS

**Risk:** Low per file, but high volume. Best tackled incrementally or with a codemod.

### 4.2 Consolidate near-identical dialog pairs

**Audit found 18 mirror pairs total** (not 8 as previously claimed). **Only 6 are near-identical** and worth consolidating:

| Pair | Verdict | Action |
|---|---|---|
| update-app | Byte-identical | Consolidate to shared component |
| create-policy-modal | Only cosmetic comment diffs | Consolidate to shared component |
| update-role-modal | Only extra JSDoc/comments | Consolidate to shared component |
| test-webhook | Only class/selector names differ | Consolidate to shared component |
| secret-display | Only class/selector names differ | Consolidate to shared component |
| edit-client | Byte-identical | Consolidate to shared component |
| create-app | **Meaningfully different** (post-creation summary differs) | Leave as-is |
| create-group | **Meaningfully different** (super-admin has tenant selector) | Leave as-is |
| update-group | **Meaningfully different** (copy-paste bug, different events) | Leave as-is; fix copy-paste bug |
| update-tenant | **Meaningfully different** (different services, change detection) | Leave as-is |
| create-client | **Meaningfully different** (tenant selector in admin) | Leave as-is |
| add-role | **Meaningfully different** (different services, API signatures) | Leave as-is |
| add-member | **Meaningfully different** (different services, API signatures) | Leave as-is |

**Additional findings from audit:**
- Fix copy-paste bug in `super-admin/group/dialogs/update-group.component.ts` — form IDs say `create.group.name`/`createGroupForm` instead of `update.group.name`/`updateGroupForm`
- Fix wrong selector in `secure/tenants/dialogs/add-role.component.ts` — uses `app-create-tenant` instead of `app-add-role`
- Clean up mysterious variable names (`krishna: any`, `submitTrigger: any`, `submitRef: any`) across template-driven forms

### 4.3 Clean up form variable names

Across both secure/ and super-admin/dialogs, replace meaningless variable names (`krishna`, `submitTrigger`, `submitRef`) used only as `ngForm.onSubmit(...)` parameters with conventional names or remove them entirely.

**Risk:** Low.

---

## Phase 5 — CORS & Security Fix

### 5.1 Fix dual CORS handling

Two CORS mechanisms coexist:
1. Global `CorsInterceptor` (database-driven, per-client origin validation)
2. Manual OPTIONS preflight handler in `setup.ts` that allows `*` origin

**Preflight requests bypass the DB-driven check entirely.**

**Action:** Remove or restrict the OPTIONS handler in `setup.ts` so preflights also go through `CorsInterceptor`.

**Risk:** Medium — needs functional testing to ensure legitimate OPTIONS requests don't break.

### 5.2 Review `OWH32` non-standard hash

`util/crypt.util.ts` implements `oneWayHash()` using a custom FNV-1a-based algorithm named `OWH32` for PKCE code challenge method. This is **not RFC 7636 compliant** (the spec mandates plain S256). **OWH32 is actively used** — it is accepted as a valid `code_challenge_method` in `validation.schema.ts` and has dedicated tests. Not dead code.

**Action:** Replace with proper S256 or remove the OWH32 option from the validation schema.

**Risk:** Medium — requires updating any clients relying on the `OWH32` code challenge method.

---

## Phase 6 — Migration Squash (Lower Priority)

Group 28 migrations into logical milestones:

| Milestone | Migrations | Topic |
|---|---|---|
| 1 | 1681147242561 through 1718012430697 (earliest ~5) | Initial schema + OIDC core |
| 2 | 1698765432100 through 1747000000000 (next ~5) | Authorization tables, subscriptions, apps |
| 3 | 1748000000000 through 1752000000000 (next ~6) | Clients, PKCE, refresh tokens |
| 4 | 1753000000000 through 1758000000000 (next ~6) | Refresh tokens, sessions, consents, aliases |
| 5 | 1759000000000 through 1771000000000 (latest ~6) | Resource indicators, app client identity, onboarding config |

**Risk:** Medium. Requires a fresh DB to apply. Must preserve column/table names and data transformations exactly.

---

## Appendix — File Inventory (Updated May 2026)

### Backend (`srv/src/`)

| Directory | Files |
|---|---|
| `controllers/` | 27 |
| `auth/` | 25 |
| `entity/` | 21 |
| `migrations/` | 28 (+1 registry `migrations/migrations.ts`) |
| `services/` | 16 (+ `key-management.service.ts` not in previous inventory) |
| `casl/` | 12 |
| `core/` | 8 |
| `mail/` | 5 (FakeSmtpServer.ts moved to `tests/smtp/`) |
| `exceptions/` | 4 (+ 2 in `filter/` subdirectory) |
| `log/` | 4 |
| `interceptors/` | 1 (missing from previous inventory) |
| `util/` | 6 (`utils/` merged — no longer exists) |
| `config/` | 2 |
| `security/` | 2 |
| `validation/` | 2 |
| `dto/` | 1 |
| root | 4 (`app.module.ts`, `main.ts`, `setup.ts`, `startUp.service.ts`) |
| **Total** | **~168** |

### Frontend (`ui/src/app/`)

| Area | Files |
|---|---|
| `_services/` | 19 |
| `component/` | 57 |
| `open-pages/` | 21 |
| `secure/` | 22 |
| `super-admin/` | 44 |
| `shared/` | 4 |
| `_helpers/` | 3 |
| `model/` | 1 |
| `error-pages/` | 1 |
| root | 3 |
| **Total** | **175** |

### Tests (`srv/tests/`)

| Area | Files |
|---|---|
| `properties/` | 87 |
| `auth/` | 42 |
| root | 18 (many support files, not just specs) |
| `integration/` | 11 |
| `api-client/` | 11 (+ `client.ts` not in previous inventory) |
| `tenant/` | 4 |
| `me/` | 3 |
| `users/` | 3 |
| `policy/` | 3 |
| `features/` | 3 |
| `consent/` | 2 |
| `onboarding/` | 2 |
| `apps_&_subscription/` | 2 (rename to `apps-and-subscription/`) |
| `client/` | 1 |
| `group/` | 1 |
| `password-grant/` | 1 |
| `tenant-key-value/` | 1 |
| `third-party-compliance/` | 1 |
| `casl/` | 1 |
| `util/` | 1 |
| **Total** | **186** |
