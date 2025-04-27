


git pull

if [ ! -d logs ]; then
    mkdir logs
fi


# happiness
just download-and-import-image > ./logs/download.log
just dry-run-auth-server > ./logs/dry-run.log
just deploy-auth-server > ./logs/deploy.log