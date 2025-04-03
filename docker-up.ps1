# Build UI
cd ui
npm run build

# Build backend
cd ../srv
npm run build

cd ..
# build image
# docker build
minikube image build -t uaa-auth-srv-img ./Dockerfile

# deploy
#docker-compose up