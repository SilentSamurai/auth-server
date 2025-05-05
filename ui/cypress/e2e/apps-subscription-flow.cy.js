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

    it('Tenant B should be able to subscribe and Open App', () => {
        cy.login(TENANT_B_ADMIN, 'admin9000', TENANT_B_DOMAIN);
        cy.openTenantOverviewTile();
        cy.subscribeAppFromOverview(APP_NAME);
        cy.openSubscribedApp(APP_NAME);
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
