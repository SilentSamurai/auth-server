#!/bin/bash
# Launch the NestJS backend. Replicates `npm run start:prod`
# (NODE_ENV=production node dist/src/main) plus the port juggling that
# scripts/start-standalone.sh performed: the backend listens on BACKEND_PORT
# (default 9001), leaving the container PORT for nginx.
set -eu

export NODE_ENV=production
export ENV="${ENV:-production}"
export PORT="${BACKEND_PORT:-9001}"

cd /home/app/srv
exec /usr/local/bin/node dist/src/main
