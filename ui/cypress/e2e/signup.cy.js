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

    it('Should send verification email (via control API), verify, then login', () => {
        const SMTP_SERVER = 'http://127.0.0.1:8899/__test__/emails';
        const email = uniqueEmail();
        const password = 'testpass123';

        // Clear inbox
        cy.request('POST', `${SMTP_SERVER}/clear`);

        // Go directly to step 2 with client_id preset
        cy.visit('/signup?client_id=shire.local');

        // Fill details and submit
        cy.get('input#name').type('Test User');
        cy.get('input#email').type(email);
        cy.get('input#password').type(password);
        cy.intercept('POST', '**/api/signup*').as('signUp');
        cy.contains('button', 'Sign Up').click();
        cy.wait('@signUp').should(({response}) => {
            expect(response && response.statusCode).to.be.oneOf([201, 200]);
        });

        // Fetch latest email and visit verification link (normalize https->http locally)
        cy.request({
            url: `${SMTP_SERVER}/latest`,
            qs: { to: email, subject: 'Thank you for signing up', timeoutMs: 15000 }
        }).then(({ body }) => {
            expect(body.links && body.links.length).to.be.greaterThan(0);
            const raw = body.links.find(l => !l.endsWith(']')) || body.links[0];
            const verifyUrl = (raw || '').replace(/\]$/, '');
            const normalized = verifyUrl.replace(/^https:\/\//, 'http://');
            cy.request({ url: normalized, followRedirect: true })
              .its('status')
              .should('be.oneOf', [200, 301, 302, 303, 307, 308]);
        });

        // Now login
        cy.visit('/login?client_id=shire.local');
        cy.get('input#username').type(email);
        cy.get('input#password').type(password);
        cy.get('#login-btn').click();
        cy.url().should('include', '/home');
    });
});
