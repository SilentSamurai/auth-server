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

const users = loadJson('../data/users.json', []);
const client = loadJson('../data/client.json', { clientId: '', redirectUri: '' });

const AUTHORIZE_URL = `${BASE_URL}/api/oauth/authorize`;
const LOGIN_URL = `${BASE_URL}/api/oauth/login`;
const CONSENT_URL = `${BASE_URL}/api/oauth/consent`;

const AUTH_PARAMS_BASE =
    `response_type=code` +
    `&scope=openid+profile+email` +
    `&redirect_uri=${encodeURIComponent(client.redirectUri)}` +
    `&client_id=${encodeURIComponent(client.clientId)}`;

export const options = {
    vus: 125,
    iterations: 125,
    thresholds: Object.assign({}, COMMON_THRESHOLDS, {
        http_req_duration: ['p(95)<5000', 'p(99)<8000'],
    }),
};

function cookieNameValue(setCookie) {
    if (!setCookie) return '';
    return setCookie.split(';')[0].trim();
}

function getQueryParam(url, name) {
    var regex = new RegExp('[?&]' + name + '=([^&#]*)');
    var match = url.match(regex);
    return match ? decodeURIComponent(match[1]) : '';
}

export default function () {
    var user = randomItem(users);
    if (!user) return;

    var state = Math.random().toString(36).substring(2, 15);
    var authUrl = AUTHORIZE_URL + '?' + AUTH_PARAMS_BASE + '&state=' + state;

    var step1Res = http.get(authUrl, { redirects: 0 });

    var flowIdCookie = step1Res.headers['Set-Cookie'];
    var flowId = extractSignedCookieValue(flowIdCookie, 'flow_id');
    if (!flowId) {
        check(step1Res, { 'got flow_id cookie': () => false });
        return;
    }
    var csrfToken = computeCsrfToken(flowId);

    // Step 2: POST /login → get sid cookie
    var loginPayload = JSON.stringify({
        email: user.email,
        password: user.password,
        client_id: client.clientId,
        csrf_token: csrfToken,
    });

    var step2Res = http.post(LOGIN_URL, loginPayload, {
        headers: {
            'Content-Type': 'application/json',
            Cookie: cookieNameValue(flowIdCookie),
        },
    });

    var loginOk = check(step2Res, {
        'login 2xx': function (r) { return r.status === 200 || r.status === 201; },
        'login success': function (r) {
            try {
                var body = r.json();
                return body.success === true || body.requires_tenant_selection === true;
            } catch (e) {
                return false;
            }
        },
    });

    if (!loginOk) return;

    var sidCookie = step2Res.headers['Set-Cookie'];
    var sessionCookies = [cookieNameValue(sidCookie), cookieNameValue(flowIdCookie)].filter(Boolean).join('; ');

    // Step 3: GET /authorize with session → may redirect to consent or session-confirm
    var authorizeRes = http.get(authUrl, { redirects: 0, headers: { Cookie: sessionCookies } });
    var authorizeLocation = authorizeRes.headers['Location'] || '';

    check(authorizeRes, {
        'authorize redirect': function (r) { return r.status === 302; },
    });

    // Step 3a: Handle consent if required
    if (authorizeLocation.indexOf('view=consent') !== -1) {
        var consentCsrf = getQueryParam(authorizeLocation, 'csrf_token') || csrfToken;

        http.post(CONSENT_URL, JSON.stringify({
            decision: 'grant',
            client_id: client.clientId,
            scope: 'openid profile email',
            csrf_token: consentCsrf,
        }), {
            headers: {
                'Content-Type': 'application/json',
                Cookie: sessionCookies,
            },
        });

        authorizeRes = http.get(authUrl + '&session_confirmed=true', {
            redirects: 0,
            headers: { Cookie: sessionCookies },
        });
        authorizeLocation = authorizeRes.headers['Location'] || '';
    }

    // Step 3b: Handle session-confirm if required
    if (authorizeLocation.indexOf('view=session-confirm') !== -1) {
        authorizeRes = http.get(authUrl + '&session_confirmed=true', {
            redirects: 0,
            headers: { Cookie: sessionCookies },
        });
        authorizeLocation = authorizeRes.headers['Location'] || '';
    }

    // Step 4: Extract authorization code from final redirect
    check(null, {
        'has code in redirect': function () {
            var code = getQueryParam(authorizeLocation, 'code');
            return typeof code === 'string' && code.length > 0;
        },
    });
}
