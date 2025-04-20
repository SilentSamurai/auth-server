# --- Service Justfile: Backend Server Task Automation ---
# This Justfile defines commands for common backend tasks (development, build, test, release, production).

# -----------------------------------
# DEVELOPMENT COMMANDS
# -----------------------------------

# Starts the backend server in development mode with debug options enabled.
[group('srv')]
[working-directory: 'srv']
local-start-srv:
    # Run development server with debug output (e.g., for local development)
    npm run start:debug

# -----------------------------------
# BUILD COMMANDS
# -----------------------------------

# Installs dependencies and builds the backend server for deployment or further tasks.
[group('srv')]
[working-directory: 'srv']
build-srv:
    # Install backend dependencies
    npm i
    # Build backend code (typically compiles TS to JS)
    npm run build

# Builds and runs release tasks, including tests and packing, as defined by the 'release' npm script.
[group('srv')]
[working-directory: 'srv']
release-srv:
    # Execute the backend release routine (build + package + test)
    npm run release

# -----------------------------------
# TEST COMMANDS
# -----------------------------------

# Run backend server unit/integration tests.
[group('srv')]
[working-directory: 'srv']
test-srv:
    # Run backend test suite (according to npm 'test' script)
    npm run test

# -----------------------------------
# PRODUCTION COMMANDS
# -----------------------------------

# Starts the backend server in production mode.
[group('srv')]
[working-directory: 'srv']
prod-start-srv:
    # Ensure in production context, then start prod server
    cd ./srv
    npm run start:prod

