# Consolidation Plan — Reducing Entropy

This document tracks the technical debt reduction and consolidation
effort. The goal is to trim AI-generated bloat, eliminate redundancy,
and make the codebase more maintainable without changing external
behavior. Updated from deep-dive audit (May 2026).

---

## Diagnosis Summary

| Source | Severity | Description |
|--------|----------|-------------|
| `oauth-token.controller.ts` | High | ~~881 lines — split into 4 controllers + `SessionHelperService`~~ |
| Property-based tests | High | 87 files (47% of all tests), many exercising same flows |
| Dead code | High | ~~4 unused files found~~ (already deleted in Phase 0) |
| `token-issuance.service.ts` | High | ~~668 lines — claim assembly extracted to `TokenClaimsService` (now ~365 lines)~~ |
| `startUp.service.ts` | High | ~~596 lines — seed logic extracted to `seed.service.ts` (now 172 lines)~~ |
| Inline DTOs scattered | Medium | ~~8+ controllers — all extracted to `dto/` (now 9 files)~~ |
| `roleV2.controller.ts` | Medium | V2 endpoints added alongside V1 instead of consolidating |
| `contexts.ts` mixed concerns | Medium | ~~277 lines — split into `grant-types.ts`, `token-types.ts`, `auth-context.ts` (now a barrel)~~ |
| `search-filter.utils.ts` misplaced | ~~Medium~~ | ~~Utility file living in `controllers/` directory~~ (moved to `util/`) |
| `GET /api/oauth/logout` defined in 2 controllers | Medium | OAuthTokenController + RevocationController — latent routing conflict |
| Dual CORS handling | Medium | Global `CorsInterceptor` (DB-driven) bypassed by `*` OPTIONS handler |
| `FakeSmtpServer.ts` in `src/mail/` | ~~Medium~~ | ~~409-line test support file inside application source~~ (moved to `tests/smtp/`) |
| Duplicate `theme.service.ts` | ~~Low~~ | ~~Byte-identical file in `_services/` and `component/theme/`~~ (resolved — duplicate deleted) |
| Inline Angular templates | Low | 114 `template:`, only 1 `templateUrl:` |
| Mirrored UI components | Medium | 18 mirror pairs found (8 claimed, 10 newly identified) |
| No barrel files | Low | All imports reference individual files directly |
| `util/` vs `utils/` | ~~Low~~ | ~~Two directories, same purpose~~ (merged into `util/`) |
| `migrations/` | ~~Medium~~ | ~~28 files (+1 registry)~~ — squashed to 5 milestone files ✅ |
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

### 2.2 Merge `roleV2.controller.ts` into `role.controller.ts` ✅

**Status:** Done. V2 routes `PATCH /api/role/:roleId` and `GET /api/role/:roleId` merged into `RoleController`. Controller prefix changed from `api/tenant` to `api`; V1 routes adjusted to `/tenant/my/...`. Shared `_getRoleWithUsers()` helper deduplicates role-by-name and role-by-ID lookups. `RoleControllerV2` class and file deleted.

**Risk:** Low. No route conflicts. Same 4 injected services. All 185 test suites, 1207 tests pass.

### 2.3 Split `token-issuance.service.ts` ✅

**Status:** Done. Extracted `TokenClaimsService` from the 668-line monolith. The new service handles scope resolution, role fetching/formatting, audience construction, session resolution, and refresh token decisions. `TokenIssuanceService` retained orchestration only (membership checks, auth code hint resolution, JWT signing via AuthService, ID token generation, refresh token lifecycle, security logging). JWT signing was already handled by `AuthService` — no `TokenSigningService` was needed. No circular dependencies. `token-issuance.service.ts` reduced from 668 → ~365 lines.

**Risk:** Medium. Dependencies carefully analyzed; no circular imports introduced.

### 2.4 Split `startUp.service.ts` (596→172 lines) ✅

**Status:** Done. Extracted dev-only seed methods into `SeedService` (`srv/src/seed.service.ts`):
- `SeedService` — `populateDummyUsers()`, `createDummyTenantAndUser()`, `createDummyAppsGroupsRoles()`, `resolveAdminUiCallbackUris()`
- `StartUpService` — slimmed down to bootstrap orchestration only (`onModuleInit()`, `createAdminUser()`, `populateGlobalTenant()`); delegates to `SeedService` for dev/test seeding
- Registered `SeedService` in `AppModule.providers`

**Risk:** Low. Pure extraction; no behavioral change. All tests pass.

### 2.5 Split `contexts.ts` (277 lines) ✅

**Status:** Done. Split into 3 focused files:
- `casl/grant-types.ts` — `GRANT_TYPES` enum
- `casl/token-types.ts` — `Token`, `TenantToken`, `TechnicalToken`, `InternalToken` classes; `TenantTokenParams`, `TechnicalTokenParams`, `TenantInfo` interfaces; `ChangeEmailToken`, `ResetPasswordToken`, `EmailVerificationToken`, `RefreshToken` classes
- `casl/auth-context.ts` — `AuthContext` class, `TenantInfo` interface
- `contexts.ts` — now a barrel re-exporting all 3 (backward compat for 22 test files)
- All 16 source imports updated to point to specific files

**Risk:** Low. Pure extraction; barrel guarantees backward compat for tests.

### 2.6 DTO Standardization ✅

**Status:** Done. Extracted all inline Yup schemas from controllers into per-domain DTO files under `srv/src/dto/`:

| New file | Schemas | Source |
|---|---|---|
| `dto/validation-common.ts` | `USERNAME_REGEXP`, `PASSWORD_REGEXP`, `parseDateString`, yup extension | Shared constants |
| `dto/user.dto.ts` | `SignUpSchema`–`UpdateUserPasswordSchema` (18 schemas) | validation.schema + users.admin.controller |
| `dto/tenant.dto.ts` | `CreateTenantSchema`, `UpdateTenantSchema`, `MemberOperationSchema`, `MemberOperationsSchema`, `OperatingRoleSchema` | validation.schema + admin-tenant/tenant/members controllers |
| `dto/role.dto.ts` | `CreateRoleSchema`, `OperatingRoleSchema`, `UpdateRoleSchema` | validation.schema + role.controller |
| `dto/oauth.dto.ts` | `PasswordGrantSchema`–`AuthorizeSchema` (11 schemas) | validation.schema |
| `dto/group.dto.ts` | `CreateGroupSchema`, `UpdateGroupSchema`, `UpdateGroupRole`, `UpdateGroupUser` | validation.schema |
| `dto/policy.dto.ts` | `CreatePolicySchema`, `UpdatePolicySchema` | policy.controller |
| `dto/registration.dto.ts` | `RegisterDomainSchema`, `SignUpSchema` | registration.controller |

`validation/validation.schema.ts` reduced from 410→59 lines — now a barrel that imports from dto/ and re-exports the original `ValidationSchema` namespace for backward compat.

All 7 controllers updated to import from `dto/` instead of inline statics.

**dto/ now has 9 files** (including existing `onboard-customer.dto.ts`).

**Risk:** Low. Pure extraction; backward compat via barrel.

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

## Phase 6 — Migration Squash ✅ COMPLETED

Grouped 28 migrations into 5 logical milestones:

| Milestone | File | Topic | Merged Migrations |
|---|---|---|---|
| 1 | `1800000000000-milestone-1-initial-schema.ts` | Initial schema + OIDC core | 7 files: users, tenants, roles, tenant_members, user_roles, auth_code, authorization, groups, group_users, group_roles |
| 2 | `1800000000001-milestone-2-apps-subscriptions.ts` | Auth tables, subscriptions, apps | 3 files: apps, subscriptions, tenant_bits, app_id → roles, is_public |
| 3 | `1800000000002-milestone-3-clients-pkce.ts` | Clients, PKCE | 6 files: clients table, user locked, redirect_uri + binding columns on auth_code, pkce_method_used, nullable PKCE columns |
| 4 | `1800000000003-milestone-4-refresh-sessions-consents.ts` | Refresh tokens, sessions, consents | 6 files: refresh_tokens, tenant_keys, drop legacy keys, nonce, login_sessions, sid columns, user_consents, alias on clients |
| 5 | `1800000000004-milestone-5-resource-indicators-onboarding.ts` | Resource indicators, app identity, onboarding | 6 files: require_auth_time, allowed_resources/resource, drop tenant creds, skip_session_confirm, app client_id FK, onboarding config |

**Status:** Done. All 28 old migration files deleted. Registry (`migrations.ts`) updated to reference only the 5 milestone files. No behavioral changes — all table/column names, types, and constraints preserved exactly.

**Risk:** Requires a fresh DB to apply (existing DBs continue using previously-applied old migrations).

---

## Appendix — File Inventory (Updated May 2026)

### Backend (`srv/src/`)

| Directory | Files |
|---|---|
| `controllers/` | 27 |
| `auth/` | 25 |
| `entity/` | 21 |
| `migrations/` | 5 (+1 registry `migrations/migrations.ts`) — squashed from 28 |
| `services/` | 16 (+ `key-management.service.ts` not in previous inventory) |
| `casl/` | 15 |
| `core/` | 8 |
| `mail/` | 5 (FakeSmtpServer.ts moved to `tests/smtp/`) |
| `exceptions/` | 4 (+ 2 in `filter/` subdirectory) |
| `log/` | 4 |
| `interceptors/` | 1 (missing from previous inventory) |
| `util/` | 6 (`utils/` merged — no longer exists) |
| `config/` | 2 |
| `security/` | 2 |
| `validation/` | 2 |
| `dto/` | 9 |
| root | 5 (`app.module.ts`, `main.ts`, `setup.ts`, `startUp.service.ts`, `seed.service.ts`) |
| **Total** | **~175** |

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
