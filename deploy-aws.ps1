# Build UI
cd ui
npm run build

# Build backend
cd ../srv
npm run build

# create Zip
npm run package

cd ..
scp -i ".\keys\first-key-pair.pem" srv/dist/deploy.zip  ec2-user@ec2-54-206-82-215.ap-southeast-2.compute.amazonaws.com:/home/ec2-user

ssh -i ".\aws\first-key-pair.pem" ec2-user@ec2-54-79-180-197.ap-southeast-2.compute.amazonaws.com

# rm auth-app -r -f
# unzip deploy.zip -d "auth-app"
# cd auth-app
# npm i
# export ENV_FILE='./dist/envs/env.aws'
# export PORT=80
# npm run start:prod