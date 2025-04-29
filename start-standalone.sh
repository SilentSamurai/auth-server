

cat /etc/nginx/templates/default.conf.template | envsubst > /etc/nginx/http.d/default.conf

cat /etc/nginx/http.d/default.conf

PORT=9001

cd /home/app/srv
npm run start:prod &

nginx -g 'daemon off;'