# Import Kubernetes build recipes
import './k8s-build.just'

# Import UI commands
import './ui/ui.just'

# Import server commands
import './srv/srv.just'

# Use PowerShell on Windows
set windows-shell := ["powershell.exe", "-c"]

# Show help by default
default: help

# Build both UI and server components
build:
    just build-ui
    just build-srv

# Start the external user application (dev mode)
dev-external-start:
    cd ./external-user-app
    node server.js

# Run end-to-end tests
run-e2e-tests:
    cd ./e2e
    npm run test

# Show this help listing available commands
help:
  just --list
