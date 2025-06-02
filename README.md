# Auth Server (Nest JS)

[![Build, Test & Create Docker Image](https://github.com/SilentSamurai/auth-server/actions/workflows/build.yaml/badge.svg)](https://github.com/SilentSamurai/auth-server/actions/workflows/build.yaml)
[![Build & Release Docker Image](https://github.com/SilentSamurai/auth-server/actions/workflows/release.yaml/badge.svg)](https://github.com/SilentSamurai/auth-server/actions/workflows/release.yaml)

A production‑ready, OAuth Authorization service built with  
[Nest JS](https://nestjs.com) and [TypeScript](https://www.typescriptlang.org/).

```
.
├── srv                 → Nest‑based back‑end service
│   ├── src/            → Nest modules, controllers, services, etc.
│   ├── tests/          → Jest test suites
│   ├── db/             → Migration & seed files
│   ├── keys/           → (Local‑only) TLS keys
│   ├── Dockerfile      → Container image definition
│   ├── jest.config.js  → Test runner config
│   ├── nest-cli.json   → Nest CLI config
│   ├── package.json    → Project metadata & scripts
│   └── tsconfig*.json  → Build configurations
└── ui                  → Angular front‑end workspace
    ├── src/            → Angular app source (components, services, etc.)
    ├── nginx/          → Minimal Nginx setup for containerised static hosting
    ├── Dockerfile      → Container image definition
    ├── angular.json    → Angular CLI config
    ├── package.json    → Project metadata & scripts
    └── tsconfig*.json  → TypeScript build configurations
```

---

## ✨ Features

* User registration with e‑mail verification
* Password‑based login & JWT issuance
* Token refresh & revocation
* Password reset workflow
* Change e‑mail workflow
* Role & permission system powered by **CASL**
* Cron jobs via **@nestjs/schedule** (e.g. prune expired tokens)
* Database migrations via **TypeORM**
* Fake SMTP server for local development (no external e‑mail required)
* JSON‑structured production logging, compatible with ELK/EFK stacks
* Docker & Helm charts provided for easy deployment

---

## ⚡️ Quick start

### Using npm

```bash
# 1. Install dependencies
cd srv
npm install

# 2. Copy or create an environment file
cp envs/.env.example envs/.env.development   # or point ENV_FILE yourself

# 3. Run the service in watch mode
npm run start:debug          # http://localhost:9000 by default

# In another terminal you can tail the fake SMTP output:
npm run smtp-server
```

### Using just

```bash
# 1. Install just (if not already installed)
# Windows:
scoop install just
# macOS:
brew install just
# Linux:
curl --proto '=https' --tlsv1.2 -sSf https://just.systems/install.sh | bash

# 2. Install dependencies and start the service
just install
just dev-external-start    # Starts the service in development mode

# In another terminal you can tail the fake SMTP output:
npm run smtp-server
```

---

## 🛠️ Configuration

`src/config/environment.service.ts` loads variables from the file referenced by
`ENV_FILE` (defaults to `./envs/.env.development`).  
Important keys:

| Variable                 | Purpose                        | Example            |
|--------------------------|--------------------------------|--------------------|
| `NODE_ENV`               | `development` \| `production`  | development        |
| `PORT`                   | HTTP listen port               | 9000               |
| `ENABLE_HTTPS`           | Enable TLS                     | `false`            |
| `KEY_PATH` / `CERT_PATH` | TLS key / cert paths           | `keys/key.pem`     |
| `ENABLE_CORS`            | Allow CORS                     | `true`             |
| `MAX_REQUEST_SIZE`       | Body‑parser limit (e.g. `1mb`) | `1mb`              |
| `DATABASE_*`             | TypeORM connection settings    | see `.env.example` |
| `DATABASE_SSL`           | Enable DB SSL (`true`/`false`) | false              |

Add anything else you need—the service simply reads from `process.env`.

---

## 🏗️ Useful npm scripts

| Script                                | Description                                                     |
|---------------------------------------|-----------------------------------------------------------------|
| `npm run build`                       | Clean `dist/` and compile with `tsc`                            |
| `npm run start:debug`                 | Start Nest in watch/debug mode                                  |
| `npm run start:prod`                  | Run the already‑built JS from `dist/`                           |
| `npm run test`                        | Run Jest with coverage (CI friendly)                            |
| `npm run test:watch`                  | Jest in watch mode (sets `CUSTOM_LOG=1`)                        |
| `npm run package`                     | Archive a ZIP of the compiled output via `create-zip.js`        |
| `npm run typeorm`                     | Expose `typeorm` CLI                                            |
| `npm run generate-migration "<name>"` | Create a skeleton migration in `src/migrations/`                |
| `npm run smtp-server`                 | Run the dev‑only fake SMTP server (same as `start:mail-server`) |
| `npm run release`                     | `build` + `test` – CI release helper                            |

> 💡 **Tip**: This project also uses [just](https://github.com/casey/just) for command automation. See the [Just Commands](#-just-commands) section below.

---

## 🚀 Just Commands

This project uses [just](https://github.com/casey/just) for command automation. Install it with:

```bash
# Windows (with scoop)
scoop install just

# macOS (with homebrew)
brew install just

# Linux
curl --proto '=https' --tlsv1.2 -sSf https://just.systems/install.sh | bash
```

Then run `just --list` to see all available commands. Common commands include:

| Command              | Description                                    |
|----------------------|------------------------------------------------|
| `just build`         | Build both UI and server components            |
| `just test`          | Run tests for both UI and server               |
| `just release`       | Build, test, and install                       |
| `just dev-external-start` | Start the external user app in dev mode    |
| `just run-e2e-tests` | Run end-to-end tests                           |

---

## 🧪 Testing

```bash
# unit & integration tests
npm test

# watch mode
npm run test:watch
```

Jest is configured via `jest.config.js`; e2e Cypress tests live in the project
root under `e2e/`.

---

## 🐳 Docker

Build and run locally:

```bash
docker build -t auth-server:dev ./srv
docker run -p 9000:9000 --env-file ./envs/.env.development auth-server:dev
```

---

## ☸️ Kubernetes / Helm

A reusable chart is provided in `helm/auth-server/`. Basic usage:

```bash
helm dependency update ./helm/auth-server
helm install auth ./helm/auth-server \
  --set image.tag=1.0.0 \
  --set env.NODE_ENV=production \
  --values=my-values.yaml
```

---

## 📝 Development notes

### Skipping dev‑only code in prod builds

`src/mail/FakeSmtpServer.ts` is imported **dynamically**, ensuring production
builds exclude the file entirely (see `prepareApp()` in `src/setup.ts`).

### Migrating the database

```bash
npm run typeorm migration:generate -- -n add_user_preferences
npm run typeorm migration:run
```

---

## 🤝 Contributing

1. Fork & clone
2. Create a branch (`feat/awesome-stuff`)
3. Commit & push
4. Open a PR

Please accompany code changes with unit tests where feasible.

---

## © License

[MIT](LICENSE) – © 2024 Silent Samurai
