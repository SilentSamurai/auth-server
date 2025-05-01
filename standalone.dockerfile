FROM node:20.19.0-alpine AS build


# Set work directory
WORKDIR /home/app

# SRV
COPY ./srv/package.json             /home/app/srv/
COPY ./srv/package-lock.json        /home/app/srv/
COPY ./srv/src                      /home/app/srv/src
COPY ./srv/tsconfig.build.json      /home/app/srv/
COPY ./srv/tsconfig.json            /home/app/srv/
COPY ./srv/nest-cli.json            /home/app/srv/
COPY ./srv/users.json               /home/app/srv/
COPY ./srv/envs                     /home/app/srv/envs

# UI
COPY ./ui/package-lock.json     /home/app/ui/
COPY ./ui/package.json          /home/app/ui/
COPY ./ui/src                   /home/app/ui/src/
COPY ./ui/tsconfig.json         /home/app/ui/tsconfig.json
COPY ./ui/tsconfig.app.json     /home/app/ui/tsconfig.app.json
COPY ./ui/angular.json          /home/app/ui/angular.json

# Build backend
WORKDIR /home/app/srv
RUN npm ci && npm run build

# Build frontend
WORKDIR /home/app/ui
RUN npm ci && npm run build




# Production image
FROM node:20.19.0-alpine

RUN apk add --no-cache nginx

# Copy build artifacts from previous stage
COPY --from=build /home/app/srv /home/app/srv

# Copy Nginx configs
COPY ./ui/nginx/mime.types /etc/nginx/mime.types
COPY ./ui/nginx/templates /etc/nginx/templates

# Nginx static files root (adjust as needed)
COPY --from=build /home/app/ui/dist /home/static/
COPY start-standalone.sh /home/app/start-standalone.sh

# Start script to run both backend and nginx
CMD ["sh","/home/app/start-standalone.sh"]
