# k6 Load Tests

Load tests for the auth-server using [k6](https://k6.io).

## Prerequisites

- **k6** installed ([download](https://k6.io/docs/get-started/installation/))
- **Node.js 18+** (for the seed script only)
- A **running auth-server** on `localhost:9001`

## Setup

```bash
# Install seed script dependencies
npm install

# Seed test data (clients + users) — requires a running auth-server
npm run seed
```

The seed script accepts these env vars:

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `http://localhost:9001` | Auth-server URL |
| `ADMIN_EMAIL` | `admin@auth.server.com` | Super admin email |
| `ADMIN_PASSWORD` | `admin9000` | Super admin password |
| `USER_COUNT` | `200` | Number of test users to create |
| `CLIENT_REDIRECT_URI` | `http://localhost:9999/callback` | Redirect URI for the authorize test |
| `TEST_USER_PASSWORD` | `TestPass1` | Password for all test users |

## Running Tests

All tests accept `--env VUS=N` and `--env DURATION=Ns` for basic scenarios:

```bash
# Health check (baseline)
k6 run tests/health-check.js
k6 run tests/health-check.js --env VUS=50 --env DURATION=30s

# Well-known discovery endpoints
k6 run tests/well-known.js
k6 run tests/well-known.js --env VUS=100 --env DURATION=60s

# Password grant (core auth performance)
k6 run tests/password-grant.js
k6 run tests/password-grant.js --env STAGE1_VUS=20 --env STAGE2_VUS=100

# Full authorize flow (OIDC auth code)
k6 run tests/authorize.js
k6 run tests/authorize.js --env STAGE1_VUS=5 --env STAGE2_VUS=20

# Token introspection
k6 run tests/introspection.js
k6 run tests/introspection.js --env STAGE1_VUS=10 --env STAGE2_VUS=50
```

## Test Descriptions

| Test | Endpoints | What it tests |
|------|-----------|---------------|
| `health-check.js` | `GET /api/v1/health-check` | Baseline no-auth latency |
| `well-known.js` | `GET /.well-known/*` | OIDC discovery endpoints |
| `password-grant.js` | `POST /api/oauth/token` | Argon2 password hashing + JWT signing + DB lookup |
| `authorize.js` | `GET /authorize` → `POST /login` → `GET /authorize` | Full OIDC authorize flow: password verify, session create, CSRF, consent check, auth code issue |
| `introspection.js` | `POST /api/oauth/introspect` | Token validation (resource-server facing) |

## Output

k6 prints a summary to stdout. For persistent results:

```bash
k6 run --out json=k6-output/results.json tests/password-grant.js
k6 run --out csv=k6-output/results.csv tests/password-grant.js
```
