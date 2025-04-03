import http from 'k6/http';
import {check} from 'k6';

export const options = {
    vus: 1,
    duration: '1s',
    thresholds: {
        http_req_failed: ['rate<0.06'], // http errors should be less than 1%
    }
};

const BASE_URL = "http://localhost:8080";

export default function () {
    const headers = {
        'Content-Type': 'application/json',
    };
    const response = http.post(`${BASE_URL}/io-bound`, {}, {headers});
    check(response, {
        'is status 200': (r) => r.status === 200 || r.status === 201,
        'OK': (r) => {
            const res = r.json()
            return res.status && res.status.length > 0 && res.status === 'ok'
        },
    });
}