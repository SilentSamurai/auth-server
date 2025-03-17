FROM node:20.19.0-alpine
MAINTAINER "Sourav Das"

COPY dist /home/app/dist
COPY package.json /home/app/package.json

WORKDIR /home/app

RUN npm i --omit=dev

#ENTRYPOINT ["ls", "/home/app", "-lha"]
ENTRYPOINT ["npm", "run", "start:prod"]