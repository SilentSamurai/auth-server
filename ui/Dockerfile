FROM nginx:alpine
MAINTAINER "Sourav Das"


#              ./ui/nginx/mime.types:/etc/nginx/mime.types
#            - ./ui/nginx/templates:/etc/nginx/templates
#            - ./srv/dist/static:/home/static/

COPY nginx/mime.types /etc/nginx/mime.types
COPY nginx/templates /etc/nginx/templates

COPY dist /home/static
