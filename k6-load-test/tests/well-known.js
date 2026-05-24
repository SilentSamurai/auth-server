import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, SUPER_TENANT_DOMAIN, COMMON_THRESHOLDS, checkStatus200 } from '../lib/config.js';

export const options = {
    vus: __ENV.VUS ? parseInt(__ENV.VUS) : 10,
    duration: __ENV.DURATION || '30s',
    thresholds: Object.assign({}, COMMON_THRESHOLDS, {
        http_req_duration: ['p(95)<1000'],
    }),
};

const WELL_KNOWN_URL = `${BASE_URL}/${SUPER_TENANT_DOMAIN}/.well-known/openid-configuration`;
const JWKS_URL = `${BASE_URL}/${SUPER_TENANT_DOMAIN}/.well-known/jwks.json`;

export default function () {
    const responses = http.batch([
        ['GET', WELL_KNOWN_URL, null, {}],
        ['GET', JWKS_URL, null, {}],
    ]);

    check(responses[0], {
        'well-known 200': (r) => checkStatus200(r),
    });

    check(responses[1], {
        'jwks 200': (r) => checkStatus200(r),
    });
}
