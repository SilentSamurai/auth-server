FROM node:20.19.0-alpine AS build


# Set work directory
WORKDIR /home/app

# Copy source files
COPY ./srv ./srv
COPY ./ui ./ui

# Build backend
WORKDIR /home/app/srv
RUN npm ci && npm run build

# Build frontend
WORKDIR /home/app/ui
RUN npm ci && npm run build




# Production image
FROM node:20.19.0-alpine

RUN apk add --no-cache nginx
RUN apk add envsubst

# Copy build artifacts from previous stage
COPY --from=build /home/app/srv /home/app/srv

# Copy Nginx configs
COPY ./ui/nginx/mime.types /etc/nginx/mime.types
COPY ./ui/nginx/templates /etc/nginx/templates

# Nginx static files root (adjust as needed)
COPY --from=build /home/app/ui/dist /home/static/

# Backend PORT and expose both ports if needed
ENV AUTH_SERVER=http://localhost:9001

# ENV OPORT=PORT
# ENV SPORT=9001

RUN cat /etc/nginx/templates/default.conf.template | envsubst > /etc/nginx/http.d/default.conf

COPY start-standalone.sh /home/app/start-standalone.sh

# Start script to run both backend and nginx
CMD ["sh","/home/app/start-standalone.sh"]
