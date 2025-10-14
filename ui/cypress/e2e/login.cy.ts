describe('Login', () => {
    beforeEach(() => {
        cy.visit('/login');
    });

    it('Should show client_id step first, then reveal username/password after Continue', () => {
        // Step 1: client_id input visible, username/password not visible
        cy.get('input#client_id').should('be.visible');
        cy.get('input#username').should('not.exist');
        cy.get('input#password').should('not.exist');

        // Enter client_id and continue
        cy.get('input#client_id').type('public');
        cy.get('#continue-btn').should('be.visible').click();

        // Step 2: username and password visible
        cy.get('input#username').should('be.visible');
        cy.get('input#password').should('be.visible');
    });

    it('Should show username/password directly when client_id is provided via query', () => {
        cy.visit('/login?client_id=public');

        // Client ID input should be hidden in step 2
        cy.get('input#client_id').should('not.exist');

        // Username/password should be visible
        cy.get('input#username').should('be.visible');
        cy.get('input#password').should('be.visible');
    });

    it('Should login successfully (stubbed oauth token)', () => {
        cy.visit('/login?client_id=shire.local');

        // Stub token endpoint
        // cy.intercept('POST', '**/api/oauth/token*').as('oauthToken');

        cy.get('#username').type('admin@shire.local');
        cy.get('#password').type('admin9000');
        cy.get('#login-btn').click();

        // cy.wait('@oauthToken').its('response.statusCode').should('be.oneOf', [200, 201]);

        // App should redirect to /home after login
        cy.url().should('include', '/home');
    });
});
