// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add('adminLogin', (email, password) => {
    cy.visit("/home");
    cy.get('#domain-pre').type("auth.server.com")

    // After filtering, we can assert that there is only the one
    // incomplete item in the list.
    cy.get('#continue-btn').click()

    cy.get('#email').type(email)
    cy.get('#password').type(password)

    cy.intercept('POST', '**/api/oauth/token*').as('authCode')

    cy.get('#login-btn').click();

    cy.wait('@authCode').should(({request, response}) => {
        expect(response.statusCode).to.be.oneOf([201, 200]);
        // expect(response && response.body).to.include('authentication_code')
    })
});

Cypress.Commands.add('login', (email, password, tenant) => {
    cy.visit("/home");
    cy.get('#domain-pre').type(tenant)

    // After filtering, we can assert that there is only the one
    // incomplete item in the list.
    cy.get('#continue-btn').click()

    cy.get('#email').type(email)
    cy.get('#password').type(password)

    cy.intercept('POST', '**/api/oauth/token*').as('authCode')

    cy.get('#login-btn').click();

    cy.wait('@authCode').should(({request, response}) => {
        expect(response.statusCode).to.be.oneOf([201, 200]);
        // expect(response && response.body).to.include('authentication_code')
    })
});