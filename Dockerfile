FROM node:20
MAINTAINER "Sourav Das"

COPY srv/dist /home/app/dist
COPY srv/package.json /home/app/package.json

WORKDIR /home/app

RUN npm install

#ENTRYPOINT ["ls", "/home/app", "-lha"]
ENTRYPOINT ["npm", "run", "start:prod"]