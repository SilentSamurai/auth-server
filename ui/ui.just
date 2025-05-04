# --- UI Justfile: Frontend Automation Tasks ---
# This Justfile defines simple commands for managing the UI/frontend part of the project.
# -----------------------------------
# DEVELOPMENT COMMANDS
# -----------------------------------
# Mark this command under the "ui" group for clarity and filtering

# Starts the frontend server in development/watch mode, live-reload JS/CSS when editing source files.
[group('ui')]
[working-directory('ui')]
start-ui:
    npm run UI:SERVE:WATCH

# -----------------------------------
# BUILD COMMANDS
# -----------------------------------
# Installs frontend dependencies and builds the production-ready UI.

# This should be used when deploying or testing an optimized build.
[group('ui')]
[working-directory('ui')]
build-ui:
    npm i
    npm run build

[group('ui')]
[working-directory('ui')]
test-ui:
    npm test
