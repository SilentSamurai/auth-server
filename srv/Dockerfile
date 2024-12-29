FROM node:20
MAINTAINER "Sourav Das"

COPY dist /home/app/dist
COPY package.json /home/app/package.json

WORKDIR /home/app

RUN npm install

#ENTRYPOINT ["ls", "/home/app", "-lha"]
ENTRYPOINT ["npm", "run", "start:prod"]