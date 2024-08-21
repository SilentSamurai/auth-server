import http from 'k6/http';
import { check } from 'k6';
import { randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { sleep } from 'k6';

const users = JSON.parse(open("./users.json"));

export const options = {
    vus: 200,
    duration: '30s',
    thresholds: {
        http_req_failed: ['rate<0.01'], // http errors should be less than 1%
    }
};

const BASE_URL = "http://localhost:9001";

export default function () {

    const user = randomItem(users);

    const payload = JSON.stringify({
        "grant_type": "password",
        "email": user.email,
        "password": "Train9000",
        "domain": "auth.server.com"
    });
    const headers = {'Content-Type': 'application/json'};
    const response = http.post(`${BASE_URL}/api/oauth/token`, payload, {headers});

    check(response, {
        'is status 200': (r) => r.status === 200 || r.status === 201,
        'token is present': (r) => {
            const res = r.json()
            return res.access_token && res.access_token.length > 0
        },

    });

    // sleep(2);
}