#!/bin/bash
# Render the nginx server config from its template, substituting the listen port
# and backend upstream. Mirrors the PORT / BACKEND_PORT / AUTH_SERVER handling
# that scripts/start-standalone.sh used to do.
set -eu

# PORT here is the nginx listen port (container PORT), default 80.
export PORT="${PORT:-80}"
# Backend upstream; defaults to the local backend on BACKEND_PORT (default 9001).
export AUTH_SERVER="${AUTH_SERVER:-http://127.0.0.1:${BACKEND_PORT:-9001}}"

mkdir -p /etc/nginx/conf.d
envsubst '${PORT} ${AUTH_SERVER}' \
    < /etc/nginx/templates/default.conf.template \
    > /etc/nginx/conf.d/default.conf
