# Stage 1: Build
FROM node:20.19.0-alpine AS build
MAINTAINER "Sourav Das"

WORKDIR /home/app

COPY package.json .
COPY package-lock.json .
COPY ./ /home/app

RUN npm ci
RUN npm run release

# Stage 2: Production
FROM node:20.19.0-alpine

WORKDIR /home/app

COPY package.json .
COPY package-lock.json .
RUN npm ci --omit=dev

COPY --from=build /home/app/dist ./dist

CMD ["npm", "run", "start:prod"]
