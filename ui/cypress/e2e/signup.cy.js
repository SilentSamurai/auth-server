describe('Sign Up', () => {
    function uniqueEmail() {
        return `testuser_${Date.now()}@mail.com`;
    }

    beforeEach(() => {
        cy.visit('/signup');
    });

    it('Should show only client_id first, then reveal other fields after Next', () => {
        // Step 1: only client_id input should be visible
        cy.get('input#client_id').should('be.visible');
        cy.contains('button', 'Next').should('be.visible');

        // Other fields should not be present yet
        cy.get('input#name').should('not.exist');
        cy.get('input#email').should('not.exist');
        cy.get('input#password').should('not.exist');

        // Enter client_id and go next
        cy.get('input#client_id').type('public');
        cy.contains('button', 'Next').click();

        // Now step 2 fields should be visible
        cy.get('input#name').should('be.visible');
        cy.get('input#email').should('be.visible');
        cy.get('input#password').should('be.visible');
    });

    it('Should prefill and hide client_id when provided via query and allow signup', () => {
        const email = uniqueEmail();

        // Navigate with client_id query
        cy.visit('/signup?client_id=shire.local');

        // Client ID input should be hidden in step 2
        cy.get('input#client_id').should('not.exist');

        // Fill details and submit
        cy.get('input#name').type('Test User');
        cy.get('input#email').type(email);
        cy.get('input#password').type('testpass123');
        cy.intercept('POST', '**/api/signup*').as('signUp');
        cy.contains('button', 'Sign Up').click();
        cy.wait('@signUp').should(({response}) => {
            expect(response && response.statusCode).to.be.oneOf([201, 200]);
        });
        cy.contains('Sign up successful! Please verify your email, then try logging in again.').should('exist');
    });
});
