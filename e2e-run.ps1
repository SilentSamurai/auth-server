#npm run ui:build

$backend = Start-Process -NoNewWindow -FilePath 'npm' -ArgumentList 'run start' -passthru

$external = Start-Process -NoNewWindow -FilePath 'npm' -ArgumentList 'run dev:external:start' -passthru

Wait-Process -Id $backend.Id -Timeout 30

npm run run:e2e-tests

Stop-Process -Id $backend.Id -Force
Stop-Process -Id $external.Id -Force