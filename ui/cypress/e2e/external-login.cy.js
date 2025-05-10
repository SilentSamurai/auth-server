describe('login', () => {
    beforeEach(() => {
        // Cypress starts out with a blank slate for each test
        // so we must tell it to visit our website with the `cy.visit()` command.
        // Since we want to visit the same URL at the start of all our tests,
        // we include it in our beforeEach function so that it runs before each test
        cy.visit('/')
    })


    it('External Login', () => {

        cy.visit('http://localhost:3000/');

        cy.get('#login-btn').click();

        cy.intercept('POST', '**/api/oauth/token*').as('authToken');

        cy.url().should('include', '/authorize');

        cy.get('#username').type("admin@shire.local")
        cy.get('#password').type("admin9000")

        // cy.intercept('POST', '**/api/oauth/login*').as('authCode')
        // cy.intercept('POST', '**/api/oauth/token*').as('authToken')

        cy.get('#login-btn').click();

        cy.wait('@authToken').should(({request, response}) => {
            expect(response.statusCode).to.be.oneOf([201, 200]);
            // expect(response && response.body).to.include('authentication_code')
        });

        // cy.origin("http://localhost:3000/", () => {})

        cy.url().should('include', '?code');

        cy.get('#decodedToken').should('contain', 'admin@shire.local');
        cy.get('#decodedToken').should('contain', 'shire.local');


    })
})
