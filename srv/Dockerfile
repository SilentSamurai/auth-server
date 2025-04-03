# Stage 1: Build
FROM node:20.19.0-alpine AS build
MAINTAINER "Sourav Das"

WORKDIR /home/app

COPY package.json .
COPY ./ /home/app

RUN npm install
RUN npm run release

# Stage 2: Production
FROM node:20.19.0-alpine

WORKDIR /home/app

COPY package.json . 
RUN npm install --omit=dev

COPY --from=build /home/app/dist ./dist 

CMD ["npm", "run", "start:prod"]
