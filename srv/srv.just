


[group('srv')]
[working-directory: 'srv']
start-srv:
    npm run start:debug

[group('srv')]
[working-directory: 'srv']
build-srv:
    npm run build

[group('srv')]
[working-directory: 'srv']
release-srv:
    npm run release

[group('srv')]
[working-directory: 'srv']
test-srv:
    npm run test

