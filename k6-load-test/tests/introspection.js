import http from 'k6/http';
import { check } from 'k6';
import { b64encode } from 'k6/encoding';
import { BASE_URL, COMMON_THRESHOLDS, loadJson } from '../lib/config.js';

const client = loadJson('./data/client.json', { clientId: '', clientSecret: '' });

const headers = { 'Content-Type': 'application/json' };

export const options = {
    scenarios: {
        introspection: {
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
        http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    }),
};

function getClientCredentialsToken() {
    const payload = JSON.stringify({
        grant_type: 'client_credentials',
        client_id: client.clientId,
        client_secret: client.clientSecret,
    });
    const res = http.post(`${BASE_URL}/api/oauth/token`, payload, { headers });
    if (res.status !== 200) return null;
    try {
        return res.json('access_token');
    } catch (e) {
        return null;
    }
}

export default function () {
    const accessToken = getClientCredentialsToken();
    if (!accessToken) return;

    const introspectPayload = JSON.stringify({
        token: accessToken,
        token_type_hint: 'access_token',
    });

    const basicAuth = b64encode(client.clientId + ':' + client.clientSecret);
    const introspectHeaders = {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + basicAuth,
    };

    const res = http.post(`${BASE_URL}/api/oauth/introspect`, introspectPayload, { headers: introspectHeaders });

    check(res, {
        'introspect 200': (r) => r.status === 200,
        'token active': (r) => {
            try {
                return r.json('active') === true;
            } catch (e) {
                return false;
            }
        },
    });
}
