cd ui
npm run build

docker build -t auth-server-ui:latest .
docker save -o auth-server-ui.tar auth-server-ui:latest

scp auth-server-ui.tar rdp@172.20.10.9:~/app

sudo k3s ctr images import auth-server-ui.tar


cd ../srv
npm run build
docker build -t auth-server:latest .

docker save -o auth-server.tar auth-server:latest


scp auth-server.tar rdp@172.20.10.9:~/app

sudo k3s ctr images import auth-server.tar

sudo k3s ctr images ls | grep  auth-server