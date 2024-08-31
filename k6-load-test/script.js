import http from 'k6/http';
import {check} from 'k6';
import {randomItem} from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

const users = JSON.parse(open("./users.json"));

export const options = {
    vus: 1,
    duration: '1s',
    thresholds: {
        http_req_failed: ['rate<0.06'], // http errors should be less than 1%
    }
};

const token = ""
const BASE_URL = "http://localhost:9001";

export default function () {

    const user = randomItem(users);

    const payload = JSON.stringify({
        "grant_type": "password",
        "username": user.email,
        "password": "Train9000",
        "domain": "auth.server.com"
    });
    const headers = {
        'Content-Type': 'application/json',
        // "authorization": "Bearer " + token,
    };
    let url = `${BASE_URL}/api/v1/cpu-bound`
    if (__ENV.TEST_TYPE === "IO") {
        url = `${BASE_URL}/api/v1/io-bound`
    }
    const response = http.post(`${BASE_URL}/api/v1/io-bound`, {}, {headers});

    check(response, {
        'is status 200': (r) => r.status === 200 || r.status === 201,
        'OK': (r) => {
            const res = r.json()
            return res.status && res.status.length > 0 && res.status === 'ok'
        },

    });

    // const response = http.get(`${BASE_URL}/api/users/${user.id}`, {headers});

    // check(response, {
    //     'is status 200': (r) => r.status === 200 || r.status === 201,
    //     'user match': (r) => {
    //         const res = r.json()
    //         return res.id === user.id
    //     },
    //
    // });

    // sleep(2);
}