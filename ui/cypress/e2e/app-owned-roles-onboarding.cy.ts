/// <reference types="cypress" />

import { extractFirstLinkFromEmail, normalizeDevLink } from '../support/helpers';

describe('App-Owned Roles & Customer Onboarding', () => {
    let uniqueSuffix: number;
    let appEditorId: string;
    let appViewerId: string;
    let confidentialClientId: string;
    let confidentialClientSecret: string;

    const APP_OWNER_EMAIL  = Cypress.env('appOwnedRolesTestEmail');
    const APP_OWNER_PASS   = Cypress.env('appOwnedRolesTestPassword');
    const APP_OWNER_DOMAIN = Cypress.env('appOwnedRolesTestClientId');
    const APP_URL  = 'http://localhost:3000';
    const APP_DESC = 'Test app for app-owned roles E2E';

    const SMTP_API = 'http://127.0.0.1:8899/__test__/emails';
    const EXT_APP = 'http://localhost:3000/app-owned-roles.html';
    const END_USER_PASSWORD = 'EndUser9000!';

    let EDITOR_APP_NAME: string;
    let VIEWER_APP_NAME: string;
    let EDITOR_ROLE: string;
    let VIEWER_ROLE: string;
    let CONFIDENTIAL_CLIENT_NAME: string;
    let CUSTOMER_A_DOMAIN: string;
    let CUSTOMER_A_USER_EMAIL: string;
    let CUSTOMER_A_USER_NAME: string;
    let CUSTOMER_B_DOMAIN: string;
    let CUSTOMER_B_USER_EMAIL: string;
    let CUSTOMER_B_USER_NAME: string;

    let customerAResetToken: string;
    let customerBResetToken: string;

    before(() => {
        uniqueSuffix = Date.now();

        EDITOR_APP_NAME = `OnboardEdit-${uniqueSuffix}`;
        VIEWER_APP_NAME = `OnboardView-${uniqueSuffix}`;
        EDITOR_ROLE     = `editor-${uniqueSuffix}`;
        VIEWER_ROLE     = `viewer-${uniqueSuffix}`;
        CONFIDENTIAL_CLIENT_NAME = `Onboard-CC-${uniqueSuffix}`;

        CUSTOMER_A_DOMAIN     = `cust-a-${uniqueSuffix}.local`;
        CUSTOMER_A_USER_EMAIL = `cust-a-user-${uniqueSuffix}@mail.com`;
        CUSTOMER_A_USER_NAME  = 'Customer A User';

        CUSTOMER_B_DOMAIN     = `cust-b-${uniqueSuffix}.local`;
        CUSTOMER_B_USER_EMAIL = `cust-b-user-${uniqueSuffix}@mail.com`;
        CUSTOMER_B_USER_NAME  = 'Customer B User';
    });

    it('Phase 1 — App Owner: Create Apps + Roles + Policies + Confidential Client', () => {
        cy.visit('/');
        // 1.1 Login
        cy.login(APP_OWNER_EMAIL, APP_OWNER_PASS, APP_OWNER_DOMAIN);

        // 1.2 Create App Editor
        cy.userOpenTenantOverview();
        cy.addAppFromOverview(EDITOR_APP_NAME, `onboardedit-${uniqueSuffix}`, APP_URL, APP_DESC, { onboardingEnabled: true });
        cy.get('@CreateApp').then((interception: any) => {
            appEditorId = interception.response.body.id;
        });

        // 1.3 Create role editor-{ts}
        cy.userOpenTenantOverview();
        cy.get('#ROLES_SECTION_NAV').click();
        cy.contains('button', 'Create').click();
        cy.get('#add\\.role\\.name').type(EDITOR_ROLE);
        cy.intercept('POST', '**/api/tenant/my/role/*').as('createEditorRole');
        cy.get('#ADD_TENANT_ROLE_BTN').click();
        cy.wait('@createEditorRole').its('response.statusCode').should('be.oneOf', [200, 201]);
        cy.contains('td', EDITOR_ROLE).should('exist');

        // 1.4 Assign App Editor to the role
        cy.contains('td', EDITOR_ROLE).find('a').click();
        cy.url().should('include', '/RL02/');

        cy.get('app-value-help-button').contains('Assign App').click();
        cy.get('.modal-body').contains('td', EDITOR_APP_NAME).click();
        cy.get('.modal-footer').contains('button', 'Select').click();
        cy.contains('app-attribute', EDITOR_APP_NAME).should('exist');

        // 1.5 Create policies for the editor role
        cy.get('#POLICIES_SECTION_NAV').click();
        // Bust browser cache so GET /api/v1/policy/byRole/* returns fresh data
        cy.intercept('GET', '**/api/v1/policy/byRole/**', (req) => {
            delete req.headers['if-none-match'];
            delete req.headers['if-modified-since'];
        });
        cy.contains('button', 'New Policy').click();
        cy.get('#create\\.policy\\.effect').select('ALLOW');
        cy.get('#create\\.policy\\.action').select('read');
        cy.get('#create\\.policy\\.subject').type('Document');
        cy.get('#CREATE_POLICY_SUBMIT_BTN').click();
        cy.contains('td', 'read').should('exist');

        cy.contains('button', 'New Policy').click();
        cy.get('#create\\.policy\\.effect').select('ALLOW');
        cy.get('#create\\.policy\\.action').select('update');
        cy.get('#create\\.policy\\.subject').type('Document');
        cy.get('#CREATE_POLICY_SUBMIT_BTN').click();
        cy.contains('td', 'update').should('exist');

        // 1.6 Create App Viewer
        cy.userOpenTenantOverview();
        cy.addAppFromOverview(VIEWER_APP_NAME, `onboardview-${uniqueSuffix}`, APP_URL, APP_DESC, { onboardingEnabled: true });
        cy.get('@CreateApp').then((interception: any) => {
            appViewerId = interception.response.body.id;
        });

        // 1.7 Create role viewer-{ts} + assign App Viewer + create policy
        cy.userOpenTenantOverview();
        cy.get('#ROLES_SECTION_NAV').click();
        cy.contains('button', 'Create').click();
        cy.get('#add\\.role\\.name').type(VIEWER_ROLE);
        cy.intercept('POST', '**/api/tenant/my/role/*').as('createViewerRole');
        cy.get('#ADD_TENANT_ROLE_BTN').click();
        cy.wait('@createViewerRole').its('response.statusCode').should('be.oneOf', [200, 201]);
        cy.contains('td', VIEWER_ROLE).should('exist');

        cy.contains('td', VIEWER_ROLE).find('a').click();
        cy.url().should('include', '/RL02/');

        cy.get('app-value-help-button').contains('Assign App').click();
        cy.get('.modal-body').contains('td', VIEWER_APP_NAME).click();
        cy.get('.modal-footer').contains('button', 'Select').click();
        cy.contains('app-attribute', VIEWER_APP_NAME).should('exist');

        cy.get('#POLICIES_SECTION_NAV').click();
        cy.contains('button', 'New Policy').click();
        cy.get('#create\\.policy\\.effect').select('ALLOW');
        cy.get('#create\\.policy\\.action').select('read');
        cy.get('#create\\.policy\\.subject').type('Document');
        cy.get('#CREATE_POLICY_SUBMIT_BTN').click();
        cy.contains('td', 'read').should('exist');

        // 1.8 Publish both apps
        cy.userPublishApp(EDITOR_APP_NAME);
        cy.userPublishApp(VIEWER_APP_NAME);

        // 1.9 Create confidential client for client_credentials
        cy.userOpenTenantOverview();
        cy.get('#CLIENTS_SECTION_NAV').click();
        cy.contains('button', 'Create').click();

        cy.get('#name').type(CONFIDENTIAL_CLIENT_NAME);
        cy.get('#alias').type(`onboard-cc-${uniqueSuffix}`);
        cy.get('#grantTypes').clear().type('client_credentials');
        cy.get('#isPublic').uncheck();
        cy.get('#redirectUris').clear();

        cy.intercept('POST', '**/api/clients/create').as('createClient');
        cy.get('.modal-footer').contains('button', 'Create').click();

        cy.wait('@createClient').then((interception) => {
            confidentialClientId = interception.response!.body.client.clientId;
        });

        cy.get('app-secret-display pre').invoke('text').then((text) => {
            confidentialClientSecret = text.trim();
        });
        cy.contains('button', 'Close').click();

        // 1.10 Verify client appears in the list
        cy.contains('td', CONFIDENTIAL_CLIENT_NAME).should('exist');
    });

    it('Phase 2 — Onboard Customer A via external app UI', () => {
        cy.visit('/');
        cy.visit(`${EXT_APP}?client_id=${APP_OWNER_DOMAIN}&showOnboard=true`);

        cy.get('#onboardSection').should('be.visible');

        cy.get('#onboardAppId').type(appEditorId, { force: true });
        cy.get('#onboardClientId').type(confidentialClientId, { force: true });
        cy.get('#onboardClientSecret').type(confidentialClientSecret, { force: true });
        cy.get('#onboardTenantName').type('Customer A Tenant', { force: true });
        cy.get('#onboardTenantDomain').type(CUSTOMER_A_DOMAIN, { force: true });
        cy.get('#onboardUserEmail').type(CUSTOMER_A_USER_EMAIL, { force: true });
        cy.get('#onboardUserName').type(CUSTOMER_A_USER_NAME, { force: true });

        cy.get('#onboardForm').submit();

        cy.get('#onboardResult', { timeout: 15000 }).invoke('text').should('match', /Status: (200|201)/);
        cy.get('#onboardResult').should('contain', EDITOR_ROLE);
        cy.get('#onboardResult').should('contain', CUSTOMER_A_USER_EMAIL);
    });

    it('Phase 3 — Capture Customer A reset email via SMTP', () => {
        cy.visit('/');
        cy.wait(1000);

        cy.request({
            method: 'GET',
            url: `${SMTP_API}/latest`,
            qs: {
                to: CUSTOMER_A_USER_EMAIL,
                timeoutMs: 20000,
            },
            failOnStatusCode: false,
        }).then((response) => {
            expect(response.status).to.be.oneOf([200, 201]);
            const email = response.body;
            const link = extractFirstLinkFromEmail(email);
            expect(link, 'Reset password link should exist').to.exist;

            const normalized = normalizeDevLink(link!);
            const tokenMatch = normalized.match(/\/reset-password\/([^\/?#\]\)>]+)/i);
            expect(tokenMatch, 'Reset token should be extractable').to.exist;
            customerAResetToken = tokenMatch![1];
        });
    });

    it('Phase 4 — Customer A sets password via auth server UI', () => {
        cy.wrap(customerAResetToken).should('not.be.undefined').then((resetToken) => {
            cy.visit(`/reset-password/${resetToken}`);

            cy.contains('Reset Password').should('be.visible');

            cy.get('input[formcontrolname="password"]').type(END_USER_PASSWORD);
            cy.get('input[formcontrolname="confirmPassword"]').type(END_USER_PASSWORD);

            cy.intercept('POST', '**/api/oauth/reset-password/**').as('resetPassword');
            cy.contains('button', 'Reset Password').click();

            cy.wait('@resetPassword').its('response.statusCode').should('be.oneOf', [200, 201]);
            cy.get('.alert-success', { timeout: 10000 }).should('contain.text', 'Password Reset Successful');
        });
    });

    it('Phase 5 — Customer A OAuth + JWT + UserInfo + Permissions verification', () => {
        cy.visit('/');
        cy.clearAllCookies();
        cy.clearAllLocalStorage();
        cy.window().then((win) => win.sessionStorage.clear());

        cy.visit(`${EXT_APP}?client_id=${APP_OWNER_DOMAIN}`);
        cy.get('#login-btn').click();
        cy.url().should('include', '/authorize');

        cy.get('#username').type(CUSTOMER_A_USER_EMAIL);
        cy.get('#password').type(END_USER_PASSWORD);
        cy.get('#login-btn').click();

        cy.url({ timeout: 15000 }).should('not.include', 'view=login');

        cy.url().then((url) => {
            if (url.includes('/authorize')) {
                cy.get('app-authorize').invoke('attr', 'data-view').then((view) => {
                    if (view === 'consent') {
                        cy.contains('button', 'Approve').should('be.visible').click();
                    }
                });
            }
        });

        cy.url({ timeout: 10000 }).should('include', 'localhost:3000');
        cy.url().should('include', '?code');

        cy.get('#decodedToken', { timeout: 10000 }).should('not.be.empty');
        cy.get('#decodedToken').should('contain', EDITOR_ROLE);
        cy.get('#decodedToken').should('contain', CUSTOMER_A_DOMAIN);
        cy.get('#decodedToken').should('not.contain', VIEWER_ROLE);

        cy.get('#userInfo', { timeout: 10000 }).should('not.be.empty');
        cy.get('#userInfo').should('contain', CUSTOMER_A_USER_EMAIL);

        cy.get('#permissions', { timeout: 10000 }).should('not.be.empty');
        cy.get('#permissions').should('contain', '"effect": "ALLOW"');
        cy.get('#permissions').should('contain', '"action": "read"');
        cy.get('#permissions').should('contain', '"action": "update"');
        cy.get('#permissions').should('contain', '"subject": "Document"');
        cy.get('#permissions').should('contain', `"role": "${EDITOR_ROLE}"`);
    });

    it('Phase 6 — Onboard Customer B via external app UI', () => {
        cy.visit('/');
        cy.visit(`${EXT_APP}?client_id=${APP_OWNER_DOMAIN}&showOnboard=true`);

        cy.get('#onboardAppId').clear({ force: true }).type(appViewerId, { force: true });
        cy.get('#onboardClientId').clear({ force: true }).type(confidentialClientId, { force: true });
        cy.get('#onboardClientSecret').clear({ force: true }).type(confidentialClientSecret, { force: true });
        cy.get('#onboardTenantName').clear({ force: true }).type('Customer B Tenant', { force: true });
        cy.get('#onboardTenantDomain').clear({ force: true }).type(CUSTOMER_B_DOMAIN, { force: true });
        cy.get('#onboardUserEmail').clear({ force: true }).type(CUSTOMER_B_USER_EMAIL, { force: true });
        cy.get('#onboardUserName').clear({ force: true }).type(CUSTOMER_B_USER_NAME, { force: true });
        cy.get('#onboardForm').submit();

        cy.get('#onboardResult', { timeout: 15000 }).invoke('text').should('match', /Status: (200|201)/);
        cy.get('#onboardResult').should('contain', VIEWER_ROLE);
    });

    it('Phase 7 — Capture Customer B reset email via SMTP', () => {
        cy.visit('/');
        cy.wait(1000);

        cy.request({
            method: 'GET',
            url: `${SMTP_API}/latest`,
            qs: {
                to: CUSTOMER_B_USER_EMAIL,
                timeoutMs: 20000,
            },
            failOnStatusCode: false,
        }).then((response) => {
            expect(response.status).to.be.oneOf([200, 201]);
            const email = response.body;
            const link = extractFirstLinkFromEmail(email);
            expect(link, 'Reset password link should exist').to.exist;

            const normalized = normalizeDevLink(link!);
            const tokenMatch = normalized.match(/\/reset-password\/([^\/?#\]\)>]+)/i);
            expect(tokenMatch, 'Reset token should be extractable').to.exist;
            customerBResetToken = tokenMatch![1];
        });
    });

    it('Phase 8 — Customer B sets password via auth server UI', () => {
        cy.wrap(customerBResetToken).should('not.be.undefined').then((resetToken) => {
            cy.visit(`/reset-password/${resetToken}`);

            cy.contains('Reset Password').should('be.visible');

            cy.get('input[formcontrolname="password"]').type(END_USER_PASSWORD);
            cy.get('input[formcontrolname="confirmPassword"]').type(END_USER_PASSWORD);

            cy.intercept('POST', '**/api/oauth/reset-password/**').as('resetPassword');
            cy.contains('button', 'Reset Password').click();

            cy.wait('@resetPassword').its('response.statusCode').should('be.oneOf', [200, 201]);
            cy.get('.alert-success', { timeout: 10000 }).should('contain.text', 'Password Reset Successful');
        });
    });

    it('Phase 9 — Customer B OAuth + JWT + UserInfo + Permissions verification', () => {
        cy.visit('/');
        cy.clearAllCookies();
        cy.clearAllLocalStorage();
        cy.window().then((win) => win.sessionStorage.clear());

        cy.visit(`${EXT_APP}?client_id=${APP_OWNER_DOMAIN}`);
        cy.get('#login-btn').click();
        cy.url().should('include', '/authorize');

        cy.get('#username').type(CUSTOMER_B_USER_EMAIL);
        cy.get('#password').type(END_USER_PASSWORD);
        cy.get('#login-btn').click();

        cy.url({ timeout: 15000 }).should('not.include', 'view=login');

        cy.url().then((url) => {
            if (url.includes('/authorize')) {
                cy.get('app-authorize').invoke('attr', 'data-view').then((view) => {
                    if (view === 'consent') {
                        cy.contains('button', 'Approve').should('be.visible').click();
                    }
                });
            }
        });

        cy.url({ timeout: 10000 }).should('include', 'localhost:3000');
        cy.url().should('include', '?code');

        cy.get('#decodedToken', { timeout: 10000 }).should('not.be.empty');
        cy.get('#decodedToken').should('contain', VIEWER_ROLE);
        cy.get('#decodedToken').should('contain', CUSTOMER_B_DOMAIN);
        cy.get('#decodedToken').should('not.contain', EDITOR_ROLE);

        cy.get('#userInfo', { timeout: 10000 }).should('not.be.empty');
        cy.get('#userInfo').should('contain', CUSTOMER_B_USER_EMAIL);

        cy.get('#permissions', { timeout: 10000 }).should('not.be.empty');
        cy.get('#permissions').should('contain', '"action": "read"');
        cy.get('#permissions').should('contain', '"subject": "Document"');
        cy.get('#permissions').should('contain', `"role": "${VIEWER_ROLE}"`);
        cy.get('#permissions').should('not.contain', '"action": "update"');
    });

    it('Phase 10 — Policy Contrast: B lacks update that A has', () => {
        cy.visit('/');
        // Re-login as Customer A, verify permissions include update
        cy.clearAllCookies();
        cy.clearAllLocalStorage();
        cy.window().then((win) => win.sessionStorage.clear());

        cy.visit(`${EXT_APP}?client_id=${APP_OWNER_DOMAIN}`);
        cy.get('#login-btn').click();
        cy.get('#username').type(CUSTOMER_A_USER_EMAIL);
        cy.get('#password').type(END_USER_PASSWORD);
        cy.get('#login-btn').click();

        cy.url({ timeout: 15000 }).should('not.include', 'view=login');
        cy.url().then((url) => {
            if (url.includes('/authorize')) {
                cy.get('app-authorize').invoke('attr', 'data-view').then((view) => {
                    if (view === 'consent') {
                        cy.contains('button', 'Approve').should('be.visible').click();
                    }
                });
            }
        });
        cy.url({ timeout: 10000 }).should('include', 'localhost:3000');

        cy.get('#permissions', { timeout: 10000 }).should('not.be.empty');
        cy.get('#permissions').should('contain', '"action": "update"');

        // Re-login as Customer B, verify permissions do NOT include update
        cy.clearAllCookies();
        cy.clearAllLocalStorage();
        cy.window().then((win) => win.sessionStorage.clear());

        cy.visit(`${EXT_APP}?client_id=${APP_OWNER_DOMAIN}`);
        cy.get('#login-btn').click();
        cy.get('#username').type(CUSTOMER_B_USER_EMAIL);
        cy.get('#password').type(END_USER_PASSWORD);
        cy.get('#login-btn').click();

        cy.url({ timeout: 15000 }).should('not.include', 'view=login');
        cy.url().then((url) => {
            if (url.includes('/authorize')) {
                cy.get('app-authorize').invoke('attr', 'data-view').then((view) => {
                    if (view === 'consent') {
                        cy.contains('button', 'Approve').should('be.visible').click();
                    }
                });
            }
        });
        cy.url({ timeout: 10000 }).should('include', 'localhost:3000');

        cy.get('#permissions', { timeout: 10000 }).should('not.be.empty');
        cy.get('#permissions').should('not.contain', '"action": "update"');
        cy.get('#permissions').should('contain', '"action": "read"');
    });

    it('Phase 11 — Cleanup: Unsubscribe + Delete Apps', () => {
        cy.visit('/');
        // Unsubscribe Customer A
        cy.clearAllCookies();
        cy.clearAllLocalStorage();
        cy.window().then((win) => win.sessionStorage.clear());

        cy.visit(`/login?client_id=${CUSTOMER_A_DOMAIN}`);
        cy.get('#username').type(CUSTOMER_A_USER_EMAIL);
        cy.get('#password').type(END_USER_PASSWORD);
        cy.get('#login-btn').click();
        cy.url({ timeout: 10000 }).should('include', '/home');

        cy.userOpenTenantOverview();
        cy.unsubscribeFromApp(EDITOR_APP_NAME);

        // Unsubscribe Customer B
        cy.clearAllCookies();
        cy.clearAllLocalStorage();
        cy.window().then((win) => win.sessionStorage.clear());

        cy.visit(`/login?client_id=${CUSTOMER_B_DOMAIN}`);
        cy.get('#username').type(CUSTOMER_B_USER_EMAIL);
        cy.get('#password').type(END_USER_PASSWORD);
        cy.get('#login-btn').click();
        cy.url({ timeout: 10000 }).should('include', '/home');

        cy.userOpenTenantOverview();
        cy.unsubscribeFromApp(VIEWER_APP_NAME);

        // Delete both apps
        cy.clearAllCookies();
        cy.clearAllLocalStorage();
        cy.window().then((win) => win.sessionStorage.clear());

        cy.login(APP_OWNER_EMAIL, APP_OWNER_PASS, APP_OWNER_DOMAIN);
        cy.userOpenTenantOverview();
        cy.deleteAppFromOverview(EDITOR_APP_NAME);
        cy.deleteAppFromOverview(VIEWER_APP_NAME);
    });
});
