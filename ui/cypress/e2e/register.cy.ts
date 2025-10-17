describe('Register', () => {
    function uniqueEmail() {
        return `testuser_${Date.now()}@mail.com`;
    }
    function uniqueDomain() {
        return `testdomain${Date.now()}.com`;
    }

    beforeEach(() => {
        cy.visit('/register');
    });

    it('Should show validation errors for empty fields', () => {
        // Try to submit with empty form
        cy.get('button.btn-primary').first().click();
        cy.contains('Organization is required').should('exist');
        cy.contains('Domain is required').should('exist');
    });

    it('Should register a new tenant successfully', () => {
        const orgName = 'Test Org';
        const domain = uniqueDomain();
        const username = 'Test User';
        const email = uniqueEmail();
        const password = 'testpass123';

        // Step 1: Fill organization and domain
        cy.get('input#orgName').type(orgName);
        cy.get('input#domain').type(domain);
        cy.get('button').contains('Next').click();

        // Step 2: Fill user details
        cy.get('input#username').type(username);
        cy.get('input#email').type(email);
        cy.get('input#password').type(password);
        cy.intercept('POST', '**/api/register-domain*').as('registerDomain');
        cy.get('button.btn-primary').contains('Create Tenant').click();

        cy.wait('@registerDomain').should(({response}) => {
            expect(response, 'response').to.exist;
            expect(response!.statusCode).to.be.oneOf([201, 200]);
        });
        // cy.contains('Your registration is successful!').should('exist');
    });

    it('Should show error for invalid email', () => {
        // Step 1
        cy.get('input#orgName').type('Test Org');
        cy.get('input#domain').type(uniqueDomain());
        cy.get('button').contains('Next').click();
        // Step 2
        cy.get('input#username').type('Test User');
        cy.get('input#email').type('not-an-email');
        cy.get('input#password').type('testpass123');
        // cy.get('button.btn-primary').contains('Create Tenant').click();
        cy.contains('Must be a valid email address').should('exist');
    });

});
