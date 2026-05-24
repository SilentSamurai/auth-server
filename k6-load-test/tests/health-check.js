import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, COMMON_THRESHOLDS, checkStatus200 } from '../lib/config.js';

export const options = {
    vus: __ENV.VUS ? parseInt(__ENV.VUS) : 10,
    duration: __ENV.DURATION || '30s',
    thresholds: Object.assign({}, COMMON_THRESHOLDS, {
        http_req_duration: ['p(95)<500'],
    }),
};

export default function () {
    const res = http.get(`${BASE_URL}/api/v1/health-check`);

    check(res, {
        'status 200': (r) => checkStatus200(r),
    });
}
