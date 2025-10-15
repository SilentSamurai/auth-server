describe('Register', () => {
    function uniqueEmail() {
        return `testuser_${Date.now()}@mail.com`;
    }
    function uniqueDomain() {
        return `testdomain${Date.now()}.com`;
    }

    const SMTP_SERVER = 'http://127.0.0.1:8899/__test__/emails';

    beforeEach(() => {
        cy.request('POST', `${SMTP_SERVER}/clear`);
        cy.visit('/');
    });

    it('Should create a new user via external flow and verify via email control API then login', () => {

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
            expect(response, 'response').to.exist;
            expect(response!.statusCode).to.be.oneOf([201, 200]);
        });
        cy.contains('Sign up successful! Please verify your email, then try logging in again.').should('exist');

        // Fetch latest email and verify
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

        // Login after verification
        cy.visit('/login?client_id=shire.local');
        cy.get('input#username').type(email);
        cy.get('input#password').type(password);
        cy.get('#login-btn').click();
        cy.url().should('include', '/home');
    });
});
