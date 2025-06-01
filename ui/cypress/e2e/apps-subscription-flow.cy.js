describe('Apps & Subscription Flow', () => {
    const TENANT_A_ADMIN = 'admin@shire.local';
    const TENANT_A_DOMAIN = 'shire.local';
    const TENANT_B_ADMIN = 'admin@bree.local';
    const TENANT_B_DOMAIN = 'bree.local';
    const APP_NAME = 'Subscription Test App';
    const APP_URL = 'http://localhost:3000';
    const APP_DESC = 'A test app for subscription E2E';


    it('Tenant A should add an app', () => {
        cy.login(TENANT_A_ADMIN, 'admin9000', TENANT_A_DOMAIN);
        cy.openTenantOverviewTile();
        cy.addAppFromOverview(APP_NAME, APP_URL, APP_DESC);
    });

    it('Tenant B should NOT see the app before it is published', () => {
        cy.login(TENANT_B_ADMIN, 'admin9000', TENANT_B_DOMAIN);
        cy.openTenantOverviewTile();
        cy.contains('button', 'Subscriptions').click();

        cy.get('button').contains('Subscribe App').click();
        cy.get('table').should('not.contain', APP_NAME);
        cy.get('button').contains('Cancel').click();
    });

    it('Tenant A should publish the app', () => {
        cy.login(TENANT_A_ADMIN, 'admin9000', TENANT_A_DOMAIN);
        cy.publishApp(APP_NAME)
        cy.get('table').contains('tr', APP_NAME).should('contain', 'Public');
    });

    it('Tenant B should be able to subscribe and Open App', () => {
        cy.login(TENANT_B_ADMIN, 'admin9000', TENANT_B_DOMAIN);
        cy.openTenantOverviewTile();
        cy.subscribeAppFromOverview(APP_NAME);
        cy.openSubscribedApp(APP_NAME);
    });

    it("Tenant B user should be able to login to Tenant A's app", () => {
        const TENANT_B_USER = 'admin@bree.local';
        const TENANT_B_USER_PASSWORD = 'admin9000';

        cy.login(TENANT_B_ADMIN, 'admin9000', TENANT_B_DOMAIN);
        cy.openTenantOverviewTile();

        cy.visit(APP_URL);

        cy.get('button').contains('Login').click();

        cy.url().should('include', '/authorize');
        cy.get('#username').type(TENANT_B_USER);
        cy.get('#password').type(TENANT_B_USER_PASSWORD);

        cy.intercept('POST', '**/api/oauth/token*').as('authToken');
        cy.get('#login-btn').click();

        cy.wait('@authToken').should(({response}) => {
            expect(response.statusCode).to.be.oneOf([201, 200]);
        });

        cy.url().should('include', '?code');
        cy.get('#decodedToken').should('contain', TENANT_B_USER);
        cy.get('#decodedToken').should('contain', TENANT_B_DOMAIN);
    });

    it('Tenant B unsubscribe', () => {
        cy.login(TENANT_B_ADMIN, 'admin9000', TENANT_B_DOMAIN);
        cy.openTenantOverviewTile();
        cy.unsubscribeFromApp(APP_NAME);
    });

    it('Tenant A should delete an app', () => {
        cy.login(TENANT_A_ADMIN, 'admin9000', TENANT_A_DOMAIN);
        cy.openTenantOverviewTile();
        cy.deleteAppFromOverview(APP_NAME);
    });


});
