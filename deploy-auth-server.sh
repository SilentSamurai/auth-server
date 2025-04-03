


git pull

if [ ! -d logs ]; then
    mkdir logs
fi


# happiness
just build-image-ui > ./logs/build-ui.log
just build-image-backend > ./logs/build-backend.log
just deploy-auth-server > ./logs/deploy.log