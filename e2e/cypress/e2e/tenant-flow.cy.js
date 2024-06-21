describe('Tenant Flow', () => {

    const TENANT_NAME = 'Test Tenant';
    const TENANT_DOMAIN = "test-tenant.com"
    const TenantUpdateName = 'Test Updated Tenant';

    beforeEach(() => {
        // Cypress starts out with a blank slate for each test
        // so we must tell it to visit our website with the `cy.visit()` command.
        // Since we want to visit the same URL at the start of all our tests,
        // we include it in our beforeEach function so that it runs before each test

        cy.adminLogin("admin@auth.server.com", "admin9000");

        cy.visit('/');
    })


    it('Create Tenant',  function () {

        cy.url().should('include', '/home');

        cy.get('#Tenants_HOME_NAV').click()

        cy.get('a[href="/TN02"]').click()

        cy.get('#Tenant-vh-btn').click()

        cy.get('#FILTER_FIELD_domain').type(TENANT_DOMAIN);

        cy.get('#FILTER_BAR_GO_BTN').click();

    })
})