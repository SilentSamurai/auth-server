
export AUTH_SERVER=http://localhost:9001/api


cat /etc/nginx/templates/default.conf.template | sed -e 's/${PORT}/'"$PORT"'/g' |  sed -e 's,${AUTH_SERVER},'"$AUTH_SERVER"',g' > /etc/nginx/http.d/default.conf

cat /etc/nginx/http.d/default.conf

PORT=9001

cd /home/app/srv
npm run start:prod &

nginx -g 'daemon off;'