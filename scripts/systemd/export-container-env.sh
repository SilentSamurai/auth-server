#!/bin/bash
# Materialise the container/LXC runtime environment into EnvironmentFiles that
# systemd services can consume. When systemd is PID 1 the OCI/LXC environment is
# only visible in /proc/1/environ; services do not inherit it automatically.
set -eu

dump() {
    # /proc/1/environ is NUL-separated KEY=VALUE pairs.
    tr '\0' '\n' < /proc/1/environ
}

# Full application environment (may contain secrets) -> root-readable only.
dump | grep -E '^(ENV=|NODE_ENV=|PORT=|BACKEND_PORT=|AUTH_SERVER=|COOKIE_SECRET=|BASE_URL=|SUPER_ADMIN_|DEFAULT_ADMIN_|APP_NAME=|SERVICE_NAME=|LOG_LEVEL=|DATABASE_|MAIL_)' \
    > /run/container.env || true
chmod 600 /run/container.env

# Loki shipping config only -> readable by the unprivileged alloy user.
dump | grep -E '^(LOKI_)' > /run/loki.env || true
chmod 644 /run/loki.env
