# =============================================================================
# Standalone all-in-one image (backend + nginx + UI) that boots under systemd.
#
# systemd is PID 1 so that journald aggregates the backend's JSON logs and
# nginx's logs, which Grafana Alloy then ships to Loki (env: LOKI_URL). This is
# the normal Proxmox LXC model (pve-oci apply pve-compose.yml). Base is Debian
# (not Alpine) because systemd is not available on Alpine.
#
# Run locally with docker-compose (requires privileged + cgroup mount to boot
# systemd) — see the `standalone` service in docker-compose.yml.
# =============================================================================

# --------------------------- Build stage -------------------------------------
FROM node:24-bookworm-slim AS build

WORKDIR /home/app

# Toolchain for the better-sqlite3 native module (a bundled dependency; prod
# uses postgres and never loads it, but it still compiles during npm ci).
RUN apt-get update && apt-get install -y --no-install-recommends \
        python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# SRV
COPY ./srv/package.json          /home/app/srv/
COPY ./srv/package-lock.json     /home/app/srv/
COPY ./srv/src                   /home/app/srv/src
COPY ./srv/tsconfig.build.json   /home/app/srv/
COPY ./srv/tsconfig.json         /home/app/srv/
COPY ./srv/nest-cli.json         /home/app/srv/
COPY ./srv/users.json            /home/app/srv/
COPY ./srv/envs                  /home/app/srv/envs

# UI
COPY ./ui/package-lock.json      /home/app/ui/
COPY ./ui/package.json           /home/app/ui/
COPY ./ui/src                    /home/app/ui/src/
COPY ./ui/tsconfig.json          /home/app/ui/tsconfig.json
COPY ./ui/tsconfig.app.json      /home/app/ui/tsconfig.app.json
COPY ./ui/angular.json           /home/app/ui/angular.json

# Build backend
WORKDIR /home/app/srv
RUN npm ci && npm run build

# Build frontend
WORKDIR /home/app/ui
RUN npm ci && npm run build

# --------------------------- Runtime stage -----------------------------------
FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

# systemd (init), nginx, envsubst, and Grafana Alloy (from Grafana's apt repo).
RUN apt-get update && apt-get install -y --no-install-recommends \
        systemd systemd-sysv nginx gettext-base ca-certificates gpg wget \
    && mkdir -p /etc/apt/keyrings \
    && wget -q -O - https://apt.grafana.com/gpg.key | gpg --dearmor > /etc/apt/keyrings/grafana.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/grafana.gpg] https://apt.grafana.com stable main" \
        > /etc/apt/sources.list.d/grafana.list \
    && apt-get update && apt-get install -y --no-install-recommends alloy \
    && rm -rf /var/lib/apt/lists/*

# Node.js runtime, copied from the build image (glibc-compatible with Debian).
COPY --from=build /usr/local/bin/node /usr/local/bin/node
COPY --from=build /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/npm
RUN ln -sf /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm

WORKDIR /home/app/srv

# Backend production dependencies (build toolchain added then purged).
COPY ./srv/package.json ./srv/package-lock.json ./
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && npm ci --omit=dev \
    && apt-get purge -y python3 make g++ \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

# Backend build artifacts
COPY --from=build /home/app/srv/dist   ./dist
COPY --from=build /home/app/srv/envs   ./envs
COPY --from=build /home/app/srv/users.json ./users.json

# nginx config + static UI
COPY ./ui/nginx/nginx.conf   /etc/nginx/nginx.conf
COPY ./ui/nginx/mime.types   /etc/nginx/mime.types
COPY ./ui/nginx/templates    /etc/nginx/templates
COPY --from=build /home/app/ui/dist /home/static/

# Helper scripts invoked by the systemd units
COPY scripts/systemd/export-container-env.sh /usr/local/bin/export-container-env.sh
COPY scripts/systemd/render-nginx-config.sh  /usr/local/bin/render-nginx-config.sh
COPY scripts/systemd/start-backend.sh        /usr/local/bin/start-backend.sh
RUN chmod +x /usr/local/bin/export-container-env.sh \
             /usr/local/bin/render-nginx-config.sh \
             /usr/local/bin/start-backend.sh

# systemd units (our nginx.service at /etc shadows the distro one at /lib)
COPY scripts/systemd/container-env.service /etc/systemd/system/container-env.service
COPY scripts/systemd/nginx-config.service  /etc/systemd/system/nginx-config.service
COPY scripts/systemd/auth-backend.service  /etc/systemd/system/auth-backend.service
COPY scripts/systemd/nginx.service         /etc/systemd/system/nginx.service
COPY scripts/systemd/alloy-override.conf   /etc/systemd/system/alloy.service.d/override.conf

# Grafana Alloy config
COPY scripts/alloy/config.alloy /etc/alloy/config.alloy

# Unit/config files must not be executable (silences a systemd warning; the
# source files carry the git executable bit on Windows checkouts).
RUN chmod 644 /etc/systemd/system/container-env.service \
              /etc/systemd/system/nginx-config.service \
              /etc/systemd/system/auth-backend.service \
              /etc/systemd/system/nginx.service \
              /etc/systemd/system/alloy.service.d/override.conf \
              /etc/alloy/config.alloy /etc/nginx/nginx.conf

# Let the unprivileged alloy user read the journal.
RUN usermod -aG systemd-journal alloy || true

# Enable our services at boot.
RUN systemctl enable container-env.service nginx-config.service \
                     auth-backend.service nginx.service alloy.service

# Trim units that are useless (and noisy) inside a container.
RUN systemctl mask \
        systemd-udevd.service systemd-udev-trigger.service \
        systemd-firstboot.service systemd-logind.service \
        getty.target console-getty.service \
        dev-hugepages.mount sys-fs-fuse-connections.mount \
        systemd-remount-fs.service \
        2>/dev/null || true

STOPSIGNAL SIGRTMIN+3

# nginx listen (default 80, or PORT), and backend (9001) for reference.
EXPOSE 80 4200 9001

CMD ["/sbin/init"]
