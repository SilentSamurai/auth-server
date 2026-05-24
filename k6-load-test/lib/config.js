import { createHMAC } from 'k6/crypto';

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:9001';

export const SUPER_TENANT_DOMAIN = __ENV.SUPER_TENANT_DOMAIN || 'auth.server.com';

export function buildPasswordGrantPayload(email, password, clientId) {
    return JSON.stringify({
        grant_type: 'password',
        username: email,
        password: password,
        client_id: clientId,
    });
}

export function extractSignedCookieValue(setCookieHeader, cookieName) {
    if (!setCookieHeader) return null;
    const match = setCookieHeader.match(new RegExp(`${cookieName}=([^;]+)`));
    if (!match) return null;
    const raw = decodeURIComponent(match[1]);
    const colonIdx = raw.indexOf(':');
    if (colonIdx === -1) return raw;
    const dotIdx = raw.indexOf('.', colonIdx);
    return dotIdx === -1
        ? raw.substring(colonIdx + 1)
        : raw.substring(colonIdx + 1, dotIdx);
}

export function computeCsrfToken(flowId) {
    const cookieSecret = __ENV.COOKIE_SECRET || 'dev-cookie-secret-do-not-use-in-prod';
    const hmac = createHMAC('sha256', cookieSecret);
    hmac.update(flowId);
    return hmac.digest('hex');
}

export function loadJson(path, fallback) {
    try {
        return JSON.parse(open(path));
    } catch (e) {
        if (fallback !== undefined) return fallback;
        throw new Error(`Failed to load ${path}. Run "npm run seed" first.`);
    }
}

export const COMMON_THRESHOLDS = {
    http_req_failed: ['rate<0.05'],
};

export function checkStatus200(response) {
    return response.status === 200 || response.status === 201;
}
