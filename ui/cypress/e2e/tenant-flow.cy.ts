describe('Tenant Flow', () => {

    const TENANT_NAME = 'Test Tenant';
    const TENANT_DOMAIN = "test-tenant.com"
    const TenantUpdateName = 'Test Updated Tenant';
    const TENANT_MEMBER = 'boromir@mail.com';
    const ROLE_NAME = 'TEST_ROLE';

    beforeEach(() => {
        // Cypress starts out with a blank slate for each test
        // so we must tell it to visit our website with the `cy.visit()` command.
        // Since we want to visit the same URL at the start of all our tests,
        // we include it in our beforeEach function so that it runs before each test

        cy.adminLogin("admin@auth.server.com", "admin9000");
    })

    it('Create Tenant', function () {
        cy.createTenant(TENANT_NAME, TENANT_DOMAIN);
    })

    it('GET Tenant', function () {
        cy.goToTenantObjectPage(TENANT_DOMAIN);
    })


    it('Update Tenant', function () {
        cy.goToTenantObjectPage(TENANT_DOMAIN);

        cy.get('#UPDATE_TENANT_BTN').click();

        cy.get('#update\\.tenant\\.name').clear();
        cy.get('#update\\.tenant\\.name').type(TenantUpdateName);

        cy.get('#UPDATE_TENANT_SAVE_BTN').click();

    })

    it('Add Member', function () {
        cy.goToTenantObjectPage(TENANT_DOMAIN);

        // cy.get('#ADD_MEMBER_BTN').click();
        cy.get('#MEMBERS_SECTION_NAV').click();
        cy.get('#OPEN_ADD_MEMBER_DIALOG_BTN').click();

        cy.get('#add\\.member\\.name').type(TENANT_MEMBER);
        cy.get('#ADD_TENANT_MEMBER_BTN').click();

    })

    it('Remove Member', function () {
        cy.goToTenantObjectPage(TENANT_DOMAIN);

        // cy.get('#ADD_MEMBER_BTN').click();
        cy.get('#MEMBERS_SECTION_NAV').click();

        cy.get(`button[data-cy-id='${TENANT_MEMBER}']`).click()

        cy.intercept('DELETE', '**/api/tenant/*/members/delete').as('RemoveMember')

        cy.get('#CONFIRMATION_YES_BTN').click();

        cy.wait('@RemoveMember').should(({request, response}) => {
            expect(response, 'response').to.exist;
            expect(response!.statusCode).to.be.oneOf([200]);
        })

    })

    it('Add Role', function () {
        cy.goToTenantObjectPage(TENANT_DOMAIN);

        // cy.get('#ADD_MEMBER_BTN').click();
        cy.get('#ROLES_SECTION_NAV').click();
        cy.get('#ADD_ROLE_DIALOG_BTN').click();

        cy.get('#add\\.role\\.name').type(ROLE_NAME);
        cy.get('#ADD_TENANT_ROLE_BTN').click();

    })

    it('Remove Role', function () {
        cy.goToTenantObjectPage(TENANT_DOMAIN);

        // cy.get('#ADD_MEMBER_BTN').click();
        cy.get('#ROLES_SECTION_NAV').click();

        cy.get(`button[data-cy-id='${ROLE_NAME}']`).click()

        cy.intercept('DELETE', '**/api/tenant/*/role/*').as('RemoveRole')

        cy.get('#CONFIRMATION_YES_BTN').click();

        cy.wait('@RemoveRole').should(({request, response}) => {
            expect(response, 'response').to.exist;
            expect(response!.statusCode).to.be.oneOf([200]);
        })

    })

    it('Add App to Tenant', function () {
        cy.goToTenantObjectPage(TENANT_DOMAIN);

        const appName = "Tenant Test App";

        // Add App flow
        cy.contains('button', 'Apps').click();
        cy.contains('button', 'Create').click();

        cy.get('input[name="name"]').type(appName); // App name input
        cy.get('input[name="appUrl"]').type('http://localhost:3000'); // App name input
        cy.get('textarea[name="description"]').type('A test app for tenant E2E');

        cy.intercept('POST', '**/api/apps/create').as('CreateApp');

        cy.get('.modal-footer').contains('button', 'Create').click();

        cy.wait('@CreateApp').should(({request, response}) => {
            expect(response, 'response').to.exist;
            expect(response!.statusCode).to.be.oneOf([201, 200]);
        });

        cy.contains("td", appName).should("exist");

    });

    it('Delete App', () => {
        cy.goToTenantObjectPage(TENANT_DOMAIN);

        const appName = "Tenant Test App";

        cy.contains('button', 'Apps').click();

        cy.intercept('DELETE', '**/api/apps/*').as('DeleteApp');

        cy.contains("td", appName)
            .parent()
            .find('button[data-test-id="delete"]')
            .click();

        cy.get('#CONFIRMATION_YES_BTN').click();

        cy.wait('@DeleteApp').should(({request, response}) => {
            expect(response, 'response').to.exist;
            expect(response!.statusCode).to.be.oneOf([201, 200]);
        });

    })

    it('Delete Tenant', function () {
        cy.deleteTenant(TENANT_DOMAIN);
    })
})
