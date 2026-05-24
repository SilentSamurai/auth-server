const { faker } = require('@faker-js/faker');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const BASE_URL = process.env.BASE_URL || 'http://localhost:9001';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@auth.server.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin9000';
const SUPER_TENANT_DOMAIN = process.env.SUPER_TENANT_DOMAIN || 'auth.server.com';
const USER_COUNT = parseInt(process.env.USER_COUNT || '200', 10);
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '25', 10);
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPass1';
const CLIENT_ALIAS = process.env.CLIENT_ALIAS || 'k6-load-test';
const CLIENT_REDIRECT_URI = process.env.CLIENT_REDIRECT_URI || 'http://127.0.0.1:9999/callback';

const DATA_DIR = path.join(__dirname, '..', 'data');

function log(msg) {
    console.log(`[seed] ${msg}`);
}

function error(msg) {
    console.error(`[seed] ERROR: ${msg}`);
    process.exit(1);
}

async function fetchJson(url, options = {}) {
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    });
    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } catch { body = text; }
    if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}: ${JSON.stringify(body)}`);
    }
    return { status: res.status, body };
}

async function main() {
    log(`BASE_URL: ${BASE_URL}`);
    log(`Creating ${USER_COUNT} test users (batch size: ${BATCH_SIZE})...`);

    fs.mkdirSync(DATA_DIR, { recursive: true });

    // Step 1: Login as super admin
    log('Logging in as super admin...');
    const loginRes = await fetchJson(`${BASE_URL}/api/oauth/token`, {
        method: 'POST',
        body: JSON.stringify({
            grant_type: 'password',
            username: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            client_id: SUPER_TENANT_DOMAIN,
        }),
    });

    const accessToken = loginRes.body.access_token;
    log('Got admin JWT');

    const authHeaders = {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
    };

    // Step 2: Get tenant ID from JWT
    const jwtPayload = JSON.parse(
        Buffer.from(accessToken.split('.')[1], 'base64url').toString('utf8'),
    );
    const tenantId = jwtPayload.tenant?.id;
    if (!tenantId) {
        error('Could not extract tenant ID from JWT');
    }
    log(`Tenant ID: ${tenantId}`);

    // Step 3: Create OAuth client
    log('Creating OAuth client...');
    let clientId, clientSecret;
    try {
        const clientRes = await fetchJson(`${BASE_URL}/api/clients/create`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                tenantId,
                name: 'K6 Load Test Client',
                alias: `${CLIENT_ALIAS}-${crypto.randomBytes(3).toString('hex')}`,
                redirectUris: [CLIENT_REDIRECT_URI],
                allowedScopes: 'openid profile email',
                grantTypes: 'authorization_code password refresh_token client_credentials',
                responseTypes: 'code',
                allowPasswordGrant: true,
                allowRefreshToken: true,
            }),
        });
        clientId = clientRes.body.client?.clientId;
        clientSecret = clientRes.body.clientSecret;
        log(`Client created: ${clientId}`);
    } catch (e) {
        error(`Failed to create client: ${e.message}`);
    }

    // Write client config
    const clientConfig = { clientId, clientSecret, redirectUri: CLIENT_REDIRECT_URI };
    fs.writeFileSync(path.join(DATA_DIR, 'client.json'), JSON.stringify(clientConfig, null, 2));
    log('Wrote data/client.json');

    // Step 4: Create test users
    const users = [];
    let created = 0;

    for (let batch = 0; batch < Math.ceil(USER_COUNT / BATCH_SIZE); batch++) {
        const batchUsers = [];
        const emails = [];

        for (let i = 0; i < BATCH_SIZE && created + i < USER_COUNT; i++) {
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();
            const name = `${firstName} ${lastName}`;
            const email = faker.internet.email({ firstName, lastName, allowSpecialCharacters: false }).toLowerCase();

            batchUsers.push({ name, email, password: TEST_USER_PASSWORD });
            emails.push(email);
        }

        // Create users in parallel
        const createPromises = batchUsers.map(u =>
            fetchJson(`${BASE_URL}/api/users/create`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({ name: u.name, email: u.email, password: u.password }),
            }).catch(e => {
                log(`  Failed to create user ${u.email}: ${e.message}`);
                return null;
            })
        );

        const results = await Promise.all(createPromises);
        const createdUsers = batchUsers.filter((_, i) => results[i] !== null);
        users.push(...createdUsers);
        created += BATCH_SIZE;

        // Add users as tenant members (batch all emails at once)
        if (createdUsers.length > 0) {
            try {
                await fetchJson(`${BASE_URL}/api/tenant/my/members/add`, {
                    method: 'POST',
                    headers: authHeaders,
                    body: JSON.stringify({ emails: createdUsers.map(u => u.email) }),
                });
            } catch (e) {
                log(`  Warning: failed to add members batch: ${e.message}`);
            }
        }

        log(`  Batch ${batch + 1}: ${Math.min(created, USER_COUNT)}/${USER_COUNT} users`);
    }

    // Write users config
    fs.writeFileSync(path.join(DATA_DIR, 'users.json'), JSON.stringify(users, null, 2));
    log(`Wrote data/users.json (${users.length} users)`);

    log('Seed complete!');
    log(`Client ID: ${clientId}`);
    log(`Test user password: ${TEST_USER_PASSWORD}`);
}

main().catch(e => {
    error(e.message);
});
