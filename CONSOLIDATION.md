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
| Dead code | High | 4 unused files found (`RoleGuard`, `BackendError`, `JsonConsoleLogger`, commented-out blocks) |
| `token-issuance.service.ts` | High | 593 lines, not flagged for splitting |
| `startUp.service.ts` | High | 564 lines mixing startup logic with seed data |
| Inline DTOs scattered | Medium | 8+ controllers define Yup schemas inline; only 1 file in `dto/` |
| `roleV2.controller.ts` | Medium | V2 endpoints added alongside V1 instead of consolidating |
| `contexts.ts` mixed concerns | Medium | 277 lines merging grant types, token classes, auth context |
| `search-filter.utils.ts` misplaced | Medium | Utility file living in `controllers/` directory |
| `GET /api/oauth/logout` defined in 2 controllers | Medium | OAuthTokenController + RevocationController — latent routing conflict |
| Dual CORS handling | Medium | Global `CorsInterceptor` (DB-driven) bypassed by `*` OPTIONS handler |
| `FakeSmtpServer.ts` in `src/mail/` | Medium | 409-line test support file inside application source |
| Duplicate `theme.service.ts` | Low | Byte-identical file in `_services/` and `component/theme/` |
| Inline Angular templates | Low | 112 `template:`, only 1 `templateUrl:` |
| Mirrored UI components | Medium | 18 mirror pairs found (8 claimed, 10 newly identified) |
| No barrel files | Low | All imports reference individual files directly |
| `util/` vs `utils/` | Low | Two directories, same purpose, different AI sessions |
| `migrations/` | Medium | 28 files (+1 registry); could be squashed to ~5 milestones |
| `OWH32` non-standard hash | Low | Custom FNV-1a in `crypt.util.ts` bypassing RFC 7636 S256 |

---

## Phase 0 — Delete Dead Code

Zero risk, immediate payoff. Clean up files and code that serve no purpose.

### 0.1 Delete unused `RoleGuard`

**Files affected:**
- Delete `srv/src/auth/role.guard.ts` (58 lines, 5 injected services, zero imports)
- No import updates needed — nothing references it

**Risk:** Trivial. Dead code removal.

### 0.2 Delete unused `BackendError` class

**Files affected:**
- Delete `srv/src/exceptions/backend-error.class.ts` (7 lines, zero imports)

**Risk:** Trivial.

### 0.3 Delete dead `JsonConsoleLogger`

**Files affected:**
- Delete `srv/src/log/JsonConsoleLogger.ts` (37 lines)
- Remove commented-out logger registration in `srv/src/setup.ts` lines 44-46

**Risk:** Trivial.

### 0.4 Remove commented-out cluster code

**Files affected:**
- `srv/src/main.ts` — remove lines 6-35 (commented-out multi-process clustering)

**Risk:** Trivial.

### 0.5 Remove empty `static {}` block

**Files affected:**
- `srv/src/exceptions/filter/http-exception.filter.ts` — remove empty `static exceptionResolver` map and empty `static {}` block (lines 15-19)

**Risk:** Trivial.

### 0.6 Delete empty `test-utils/` directory

**Files affected:**
- `srv/src/test-utils/` (already empty)

**Risk:** Trivial.

---

## Phase 1 — Quick Wins

Low risk, high consistency gain. Can be done in any order.

### 1.1 Merge `util/` + `utils/` into single `util/` directory

**Files affected:**
- Move `srv/src/utils/slug.util.ts` → `srv/src/util/slug.util.ts`
- Move `srv/src/utils/redirect-uri.validator.ts` → `srv/src/util/redirect-uri.validator.ts`
- Update imports in `srv/src/services/app.service.ts` (2 imports)
- Delete `srv/src/utils/`

**Risk:** Trivial. No functional overlap between the files.

### 1.2 Remove duplicate `theme.service.ts`

**Files affected:**
- Delete `ui/src/app/_services/theme.service.ts`
- Update any imports pointing to `_services/theme.service` → `component/theme/theme.service`

**Risk:** Low. Check that no consumer still references the deleted path.

### 1.3 Add barrel files

Create `index.ts` in major directories for cleaner imports:

- `srv/src/controllers/index.ts`
- `srv/src/services/index.ts`
- `srv/src/auth/index.ts`
- `srv/src/entity/index.ts` (already has `entities.ts` — may just need renames)

**Risk:** Low. Barrels are additive; old import paths still work.

### 1.4 Move `search-filter.utils.ts` to `util/`

**Files affected:**
- Move `srv/src/controllers/search-filter.utils.ts` → `srv/src/util/search-filter.utils.ts`
- Update imports in consuming controllers

**Risk:** Low. It's a utility, not a controller.

### 1.5 Fix `SubjectEnum.APPS` naming inconsistency

**Files affected:**
- `srv/src/entity/subjectEnum.ts` — rename `APPS` → `APP` to match singular convention
- Update all references across the codebase (grep for `SubjectEnum.APPS`)

**Risk:** Low. Mechanical rename.

### 1.6 Remove unused `CorsInterceptor` provider registration

**Files affected:**
- `srv/src/services/service.module.ts` — remove `CorsInterceptor` from `providers` array (it's already registered globally in `setup.ts`)

**Risk:** Low.

### 1.7 Move `FakeSmtpServer.ts` from `src/mail/` to `tests/`

**Files affected:**
- Move `srv/src/mail/FakeSmtpServer.ts` → `srv/tests/smtp/FakeSmtpServer.ts`
- Update import in test files that reference it

**Risk:** Low. Not used in production code.

### 1.8 Organize orphaned root test support files

Move scattered support files from `srv/tests/` root into appropriate subdirectories:
- `fetch-utils.ts` → `api-client/`
- `test-ports.ts` → `tests/` root config (or inline)
- `smtp-client-adapter.ts` → `smtp/`
- `webhook-client-adapter.ts` → `tests/` root or `api-client/`

**Risk:** Low.

---

## Phase 2 — Structural Consolidation

Medium effort, clear architectural benefit.

### 2.1 Break up `oauth-token.controller.ts`

Split the 881-line monolith into focused controllers. Current state: 7 routes, 17 injected services, 10 private methods across 5 concerns.

**Proposed split:**

| Controller | Routes | Est. Lines | Key Services |
|---|---|---|---|
| `AuthorizeController` | GET /authorize, POST /login | ~350 | AuthorizeService, AuthService, LoginSessionService, FlowIdCookieService, CsrfTokenService |
| `TokenController` | POST /token, POST /exchange | ~250 | AuthService, AuthCodeService, TokenIssuanceService, ClientService, RefreshTokenService |
| `SessionController` | GET /session-info, GET /logout | ~100 | AuthService, LoginSessionService, TenantAmbiguityService |
| `ConsentController` | POST /consent | ~100 | ConsentService, ScopeResolverService, CsrfTokenService |

**Shared logic** (private helpers: `resolveSession()`, `issueCodeAndRedirect()`, `redirectToAuthorizeUI()`, `redirectWithError()`, `getSidCookieOptions()`) moves to `auth/session-helper.service.ts`.

**Also:** Resolve `GET /api/oauth/logout` conflict — currently defined in both `OAuthTokenController` (redirect to UI) and `RevocationController` (returns 405). Last-registered wins at runtime. Decision needed on which behavior is correct.

**Risk:** Medium. Route paths stay the same; only NestJS module registration changes. Requires careful review of inter-helper dependencies. Extract shared service first, then split.

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

### 2.3 Split `token-issuance.service.ts` (593 lines)

**Proposed split:**
- `TokenClaimsService` — claim assembly, scope resolution, claim validation
- `TokenSigningService` — JWT signing, key selection, kid header
- `TokenIssuanceService` — orchestration (keeps the coordination logic)

**Risk:** Medium. Needs careful dependency analysis to avoid circular imports.

### 2.4 Split `startUp.service.ts` (564 lines)

Separate seed/test data logic from application startup:
- `startUp.service.ts` — bootstrapping only (validate env, run startup checks)
- `seed.service.ts` — `createDummyTenantAndUser()`, `dummyTenants` array, test tenant creation

**Risk:** Low. Seed data is only used in development/testing.

### 2.5 Split `contexts.ts` (277 lines)

**Proposed split:**
- `auth/token-types.ts` — `Token`, `TenantToken`, `TechnicalToken`, `InternalToken` classes, `TenantTokenParams`, `TechnicalTokenParams` interfaces
- `auth/grant-types.ts` — `GRANT_TYPES` enum
- `auth/auth-context.ts` — `AuthContext` class, `TenantInfo` interface

**Risk:** Low. Pure extraction, no behavioral change.

### 2.6 DTO Standardization

Extract all inline Yup schemas from controllers into `srv/src/dto/`:

| Current location | Inline schema | Target file |
|---|---|---|
| `admin-tenant.controller.ts` | `UpdateTenantSchema`, `MemberOperationSchema`, `OperatingRoleSchema` | `dto/tenant.dto.ts` |
| `policy.controller.ts` | `CreateSchema`, `UpdateSchema` | `dto/policy.dto.ts` |
| `registration.controller.ts` | `RegisterDomainSchema`, `SignUpSchema` | `dto/registration.dto.ts` |
| `members.controller.ts` | `MemberOperationSchema` | `dto/tenant.dto.ts` |
| `users.admin.controller.ts` | `VerifyUserSchema`, `UpdateUserPasswordSchema` | `dto/user.dto.ts` |
| `tenant.controller.ts` | `UpdateTenantSchema` | `dto/tenant.dto.ts` |
| `roleV2.controller.ts` | `UpdateRoleSchema` | `dto/role.dto.ts` |

Also break up `validation/validation.schema.ts` (368 lines) into per-domain files under `dto/`.

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
This affects **112 TypeScript files** with inline templates (only 1 uses `templateUrl`).

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

`util/crypt.util.ts` implements `oneWayHash()` using a custom FNV-1a-based algorithm named `OWH32` for PKCE code challenge method. This is **not RFC 7636 compliant** (the spec mandates plain S256).

**Action:** Verify whether `OWH32` is actually used at runtime or is experimental dead code. If used, replace with proper S256. If dead code, remove.

**Risk:** Low to medium depending on usage.

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
| `controllers/` | 27 (includes `search-filter.utils.ts` — should be in `util/`) |
| `auth/` | 25 |
| `entity/` | 21 |
| `migrations/` | 28 (+1 registry `migrations.ts`) |
| `services/` | 16 (+ `key-management.service.ts` not in previous inventory) |
| `casl/` | 12 |
| `core/` | 8 |
| `mail/` | 6 (includes `FakeSmtpServer.ts` — should be in `tests/`) |
| `exceptions/` | 4 (+ 2 in `filter/` subdirectory) |
| `log/` | 4 |
| `interceptors/` | 1 (missing from previous inventory) |
| `util/` | 3 |
| `utils/` | 2 |
| `config/` | 2 |
| `security/` | 2 |
| `validation/` | 2 |
| `dto/` | 1 |
| root | 4 (`app.module.ts`, `main.ts`, `setup.ts`, `startUp.service.ts`) |
| `test-utils/` | 0 (empty — delete) |
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
| `apps_&_subscription/` | 1 (rename to `apps-and-subscription/`) |
| `client/` | 1 |
| `group/` | 1 |
| `password-grant/` | 1 |
| `tenant-key-value/` | 1 |
| `third-party-compliance/` | 1 |
| `casl/` | 1 |
| `util/` | 1 |
| **Total** | **186** |
