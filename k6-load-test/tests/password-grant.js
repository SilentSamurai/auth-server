import http from 'k6/http';
import { check } from 'k6';
import { randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import {
    BASE_URL,
    COMMON_THRESHOLDS,
    buildPasswordGrantPayload,
    loadJson,
} from '../lib/config.js';

const users = loadJson('./data/users.json', []);
const client = loadJson('./data/client.json', { clientId: '' });

const headers = { 'Content-Type': 'application/json' };

export const options = {
    scenarios: {
        password_grant: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '10s', target: __ENV.STAGE1_VUS ? parseInt(__ENV.STAGE1_VUS) : 20 },
                { duration: '30s', target: __ENV.STAGE2_VUS ? parseInt(__ENV.STAGE2_VUS) : 20 },
                { duration: '10s', target: 0 },
            ],
        },
    },
    thresholds: Object.assign({}, COMMON_THRESHOLDS, {
        http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    }),
};

export default function () {
    const user = randomItem(users);
    if (!user) return;

    const payload = buildPasswordGrantPayload(user.email, user.password, client.clientId);

    const res = http.post(`${BASE_URL}/api/oauth/token`, payload, { headers });

    check(res, {
        'token 200': (r) => r.status === 200,
        'has access_token': (r) => {
            try {
                return typeof r.json('access_token') === 'string' && r.json('access_token').length > 0;
            } catch (e) {
                return false;
            }
        },
    });
}
