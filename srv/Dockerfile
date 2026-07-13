# Stage 1: Build
FROM node:24-alpine AS build
MAINTAINER "Sourav Das"

WORKDIR /home/app

# Required to compile the better-sqlite3 native module on Alpine.
RUN apk add --no-cache python3 make g++

COPY package.json .
COPY package-lock.json .
COPY ./ /home/app

RUN npm ci
RUN npm run build

# Stage 2: Production
FROM node:24-alpine

WORKDIR /home/app

COPY package.json .
COPY package-lock.json .
RUN apk add --no-cache libstdc++ \
    && apk add --no-cache --virtual .native-build-deps python3 make g++ \
    && npm ci --omit=dev \
    && apk del .native-build-deps

COPY --from=build /home/app/dist ./dist

CMD ["npm", "run", "start:prod"]
