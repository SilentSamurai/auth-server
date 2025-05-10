describe('Tenant Flow', () => {

    const USER_NAME = "TEST USER"
    const USER_EMAIL = "test-user@mail.com"
    const USER_PASSWORD = "test9000"

    beforeEach(() => {
        // Cypress starts out with a blank slate for each test
        // so we must tell it to visit our website with the `cy.visit()` command.
        // Since we want to visit the same URL at the start of all our tests,
        // we include it in our beforeEach function so that it runs before each test

        cy.adminLogin("admin@auth.server.com", "admin9000");
    })

    it('Create User', function () {
        cy.visit('/');

        cy.url().should('include', '/home');
        cy.get('#Users_HOME_NAV').click()
        cy.get('a[href="/UR01"]').click()
        cy.get('#CREATE_USER_DIALOG_BTN').click()

        cy.get('#CREATE_USER_name_INPUT').type(USER_NAME);
        cy.get('#CREATE_USER_email_INPUT').type(USER_EMAIL);
        cy.get('#CREATE_USER_password_INPUT').type(USER_PASSWORD);
        cy.get('#CREATE_USER_confirmPassword_INPUT').type(USER_PASSWORD);

        cy.intercept('POST', '**/users/create*').as('createUser')

        cy.get('#CREATE_USER_SUBMIT_BTN').click();

        cy.wait('@createUser').should(({request, response}) => {
            expect(response.statusCode).to.be.oneOf([201, 200]);
            // expect(response && response.body).to.include('authentication_code')
        })

    })

    it('Select and Display User in UR02 via Value Help', function () {
        cy.visit('/');
        cy.url().should('include', '/home');
        cy.get('#Users_HOME_NAV').click();
        cy.get('a[href="/UR02"]').click();

        // Assume value help button has a test id or selector, e.g., #USER_VALUE_HELP_BTN
        cy.get('#Email-vh-btn').click();

        // In the value help dialog, search for the user by email
        cy.get('#FILTER_FIELD_email').type(USER_EMAIL);
        cy.contains('button', 'Go').click();

        // Select the user from the search results
        cy.contains('td', USER_EMAIL).click();
        cy.contains('button', 'Select').click();

        cy.contains('button', 'Continue').click();

        // Now check if the user is displayed in the user list/table
        cy.contains('app-attribute', USER_EMAIL).should('exist');
    });

    it('Delete User', function () {
        cy.visit('/');
        cy.url().should('include', '/home');

        cy.get('#Users_HOME_NAV')

        cy.get('a[href="/UR01"]').click()

        cy.get('#FILTER_FIELD_email').type(USER_EMAIL);

        cy.get('#default_FILTER_BAR_GO_BTN').click();

        cy.contains('td', USER_EMAIL)
            .parent()
            .find('button[data-test-id="delete"]')
            .click();

        cy.get("#CONFIRMATION_YES_BTN").click()

    })


})
