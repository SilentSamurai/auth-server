import http from 'k6/http';
import { check } from 'k6';
import { randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import {
    BASE_URL,
    COMMON_THRESHOLDS,
    extractSignedCookieValue,
    computeCsrfToken,
    loadJson,
} from '../lib/config.js';

const users = loadJson('./data/users.json', []);
const client = loadJson('./data/client.json', { clientId: '', redirectUri: '' });

const headers = { 'Content-Type': 'application/json' };
const AUTHORIZE_URL = `${BASE_URL}/api/oauth/authorize`;
const LOGIN_URL = `${BASE_URL}/api/oauth/login`;

const AUTH_PARAMS_BASE =
    `response_type=code` +
    `&scope=openid+profile+email` +
    `&redirect_uri=${encodeURIComponent(client.redirectUri)}` +
    `&client_id=${encodeURIComponent(client.clientId)}`;

export const options = {
    scenarios: {
        authorize_flow: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '10s', target: __ENV.STAGE1_VUS ? parseInt(__ENV.STAGE1_VUS) : 10 },
                { duration: '30s', target: __ENV.STAGE2_VUS ? parseInt(__ENV.STAGE2_VUS) : 10 },
                { duration: '10s', target: 0 },
            ],
        },
    },
    thresholds: Object.assign({}, COMMON_THRESHOLDS, {
        http_req_duration: ['p(95)<3000', 'p(99)<8000'],
    }),
};

export default function () {
    const user = randomItem(users);
    if (!user) return;

    // Step 1: GET /authorize → get flow_id cookie
    const authUrl = `${AUTHORIZE_URL}?${AUTH_PARAMS_BASE}&state=${Math.random().toString(36).substring(2, 15)}`;
    const step1Res = http.get(authUrl, { redirects: 0 });

    const flowIdCookie = step1Res.headers['Set-Cookie'];
    const flowId = extractSignedCookieValue(flowIdCookie, 'flow_id');
    if (!flowId) {
        check(step1Res, { 'got flow_id cookie': () => false });
        return;
    }

    // Step 2: POST /login
    const csrfToken = computeCsrfToken(flowId);
    const loginPayload = JSON.stringify({
        email: user.email,
        password: user.password,
        client_id: client.clientId,
        csrf_token: csrfToken,
    });

    const step2Res = http.post(LOGIN_URL, loginPayload, { headers });

    const loginOk = check(step2Res, {
        'login 200': (r) => r.status === 200,
        'login success': (r) => {
            try {
                const body = r.json();
                return body.success === true || body.requires_tenant_selection === true;
            } catch (e) {
                return false;
            }
        },
    });

    if (!loginOk) return;

    // Step 3: GET /authorize again with session cookie → get auth code
    const step3Res = http.get(authUrl, { redirects: 0 });

    check(step3Res, {
        'authorize redirect': (r) => r.status === 302,
        'has code in redirect': (r) => {
            const location = r.headers['Location'];
            return typeof location === 'string' && location.indexOf('code=') !== -1;
        },
    });
}
