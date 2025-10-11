# Import Kubernetes build recipes

import './.just/k8s-build.just'
import './srv/justfile'
import './ui/justfile'

# Use PowerShell on Windows

set windows-shell := ["powershell.exe", "-c"]

# Show help by default
default: help

test:
    just test-srv
    just test-ui

# Build both UI and server components
build:
    just build-ui
    just build-srv

# Start the external user application (dev mode)
dev-external-start:
    cd ./external-user-app
    node server.js

serve:
   concurrently --kill-others "just serve-ui" "just serve-srv"

# Run end-to-end tests
run-e2e-tests:
    cd ./e2e
    npm run test

install:
    echo "install"

release:
    just build
    just test
    just install

# Show this help listing available commands
help:
    just --list
