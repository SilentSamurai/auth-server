describe('Register', () => {
    function uniqueEmail() {
        return `testuser_${Date.now()}@mail.com`;
    }
    function uniqueDomain() {
        return `testdomain${Date.now()}.com`;
    }

    beforeEach(() => {
        cy.visit('/');
    });

    it('Should create a new tenant via external flow', () => {

        cy.visit('http://localhost:3000/');

        cy.get('#login-btn').click();

        cy.get('a').contains('Sign Up').click();

        // const orgName = 'External Org';
        // const domain = uniqueDomain();
        const name = 'External User';
        const email = uniqueEmail();
        const password = 'testpass123';

        // // Step 1: tenant info
        // cy.get('input#orgName').type(orgName);
        // cy.get('input#domain').type(domain);
        // cy.get('button').contains('Next').click();

        // Step 2: user info
        cy.get('input#name').type(name);
        cy.get('input#email').type(email);
        cy.get('input#password').type(password);
        cy.intercept('POST', '**/api/signup*').as('signup');
        cy.get('button.btn-primary').contains('Sign Up').click();
        cy.wait('@signup').should(({response}) => {
            expect(response && response.statusCode).to.be.oneOf([201, 200]);
        });
        cy.contains('Sign up successful! Please verify your email, then try logging in again.').should('exist');
    });
});
