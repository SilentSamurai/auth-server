describe('login', () => {
    beforeEach(() => {
        // Cypress starts out with a blank slate for each test
        // so we must tell it to visit our website with the `cy.visit()` command.
        // Since we want to visit the same URL at the start of all our tests,
        // we include it in our beforeEach function so that it runs before each test
        cy.visit('/')
    })

    it('Normal Login', () => {
        // We'll click on the "active" button in order to
        // display only incomplete items
        cy.get('#domain-pre').type('dummy.com')

        // After filtering, we can assert that there is only the one
        // incomplete item in the list.
        cy.get('#continue-btn').click()

        cy.get('#email').type("boromir@mail.com")
        cy.get('#password').type("boromir9000")

        cy.intercept('POST', '**/api/oauth/login*').as('authCode')

        cy.get('#login-btn').click();

        cy.wait('@authCode').should(({request, response}) => {
            expect(response.statusCode).to.be.oneOf([201]);
            // expect(response && response.body).to.include('authentication_code')
        })

    })

    it('Admin Login', () => {
        // We'll click on the "active" button in order to
        // display only incomplete items
        cy.get('#domain-pre').type('auth.server.com')

        // After filtering, we can assert that there is only the one
        // incomplete item in the list.
        cy.get('#continue-btn').click()

        cy.get('#email').type("admin@auth.server.com")
        cy.get('#password').type("admin9000")

        cy.intercept('POST', '**/api/oauth/login*').as('authCode')

        cy.get('#login-btn').click();

        cy.wait('@authCode').should(({request, response}) => {
            expect(response.statusCode).to.be.oneOf([201]);
            // expect(response && response.body).to.include('authentication_code')
        })


    })
})