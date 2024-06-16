# Build UI
cd ui
npm run build

# Build backend
cd ../srv
npm run build

# build image
#docker build

# deploy
docker-compose up