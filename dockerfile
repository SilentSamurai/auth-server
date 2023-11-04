
FROM node:16

COPY ./srv/dist/   /app/srv/dist
COPY ./srv/package.json   /app/srv/package.json
COPY ./srv/static/   /app/srv/static
COPY ./package.json  /app/package.json

WORKDIR /app/srv

RUN npm install

WORKDIR /app

ENTRYPOINT npm run start
