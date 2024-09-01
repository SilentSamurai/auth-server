# Build UI
cd ui
npm run build

# Build backend
cd ../srv
npm run build

# create Zip
npm run package

cd ..
scp -i ".\keys\first-key-pair.pem" srv/dist/deploy.zip  ubuntu@ec2-54-79-180-197.ap-southeast-2.compute.amazonaws.com:/home/ubuntu

ssh -i ".\keys\first-key-pair.pem" ubuntu@ec2-54-79-180-197.ap-southeast-2.compute.amazonaws.com

# rm auth-app -r -f
# unzip deploy.zip -d "auth-app"
# cd auth-app
# npm i
# export ENV_FILE='./dist/envs/.env.aws'
# export PORT=80
# npm run start:prod
# sudo -E  npm run start:prod
