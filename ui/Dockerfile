FROM docker.io/node:20.19.0-alpine AS build
LABEL author="Sourav Das"

COPY  ./package-lock.json /home/app/
COPY ./package.json /home/app/
COPY ./src /home/app/src
COPY ./tsconfig.json /home/app/tsconfig.json
COPY ./tsconfig.app.json /home/app/tsconfig.app.json
COPY ./angular.json /home/app/angular.json

WORKDIR /home/app/
RUN npm ci
RUN npm run build


FROM nginx:alpine
MAINTAINER "Sourav Das"

COPY nginx/mime.types /etc/nginx/mime.types
COPY nginx/templates /etc/nginx/templates

COPY --from=build  /home/app/dist /home/static
