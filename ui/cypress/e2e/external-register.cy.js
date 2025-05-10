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

    it('Should register a new user via external login (sign up) flow', () => {

        cy.visit('http://localhost:3000/');

        cy.get('#login-btn').click();

        cy.get('a').contains('Sign Up').click();

        const name = 'External User';
        const email = uniqueEmail();
        const password = 'testpass123';
        // Only step 2 fields are shown
        cy.get('input#name').type(name);
        cy.get('input#email').type(email);
        cy.get('input#password').type(password);
        cy.intercept('POST', '**/api/signup*').as('signUp');
        cy.get('button.btn-primary').contains('Sign Up').click();
        cy.wait('@signUp').should(({response}) => {
            expect(response && response.statusCode).to.be.oneOf([201, 200]);
        });
        // cy.contains('Your registration is successful!').should('exist');
    });
});
