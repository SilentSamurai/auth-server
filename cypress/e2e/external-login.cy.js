

describe('login', () => {
    beforeEach(() => {
        // Cypress starts out with a blank slate for each test
        // so we must tell it to visit our website with the `cy.visit()` command.
        // Since we want to visit the same URL at the start of all our tests,
        // we include it in our beforeEach function so that it runs before each test
        cy.visit('http://localhost:3000/external-auth-test.html')
    })

    it('External Login', () => {

        cy.get('#login-btn').click();


        cy.get('#email').type("secure@auth.server.com")
        cy.get('#password').type("admin9000")

        cy.intercept('POST', '**/api/oauth/login*').as('authCode')
        cy.intercept('POST', '**/api/oauth/token*').as('authToken')

        cy.get('#login-btn').click();

        cy.wait('@authCode').should(({request, response}) => {
            expect(response.statusCode).to.be.oneOf([201]);
            // expect(response && response.body).to.include('authentication_code')
        });

        cy.url().should('include', '?code');

        cy.get('#decodedToken').should('contain', 'secure@auth.server.com');
        cy.get('#decodedToken').should('contain', 'dummy.com');

        cy.wait('@authToken').should(({request, response}) => {
            expect(response.statusCode).to.be.oneOf([201]);
            // expect(response && response.body).to.include('authentication_code')
        })


    })
})