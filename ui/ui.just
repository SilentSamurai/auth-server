


[group('ui')]
[working-directory: 'ui']
start-ui:
    npm run UI:SERVE:WATCH


[group('ui')]
[working-directory: 'ui']
build-ui:
    npm run build
