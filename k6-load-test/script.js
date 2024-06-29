import http from 'k6/http';


export const options = {
    vus: 200,
    duration: '10s',
    thresholds: {
        http_req_failed: ['rate<0.01'], // http errors should be less than 1%
    }
};

const BASE_URL = "http://127.0.0.1:50806";

export default function () {
    const payload = JSON.stringify({
        "grant_type": "password",
        "email": "admin@auth.server.com",
        "password": "admin9000",
        "domain": "auth.server.com"
    });
    const headers = {'Content-Type': 'application/json'};
    http.post(`${BASE_URL}/api/oauth/token`, payload, {headers});
}