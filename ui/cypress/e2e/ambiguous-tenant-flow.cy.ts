describe('Ambiguous Tenant Flow', () => {
    const AMBIGUOUS_USER = {
        email: "gandalf@mail.com",
        password: "gandalf9000"
    };
    const SINGLE_TENANT_USER = {
        email: "single-tenant-user@test.com",
        password: "TestPassword123!"
    };
    const TENANTS = {
        mordor: {
            name: "Mordor Tenant",
            domain: "mordor.local"
        },
        gondor: {
            name: "Gondor Tenant",
            domain: "gondor.local"
        },
        rohan: {
            name: "Rohan Tenant",
            domain: "rohan.local"
        }
    };
    const TEST_APP = {
        name: "Test App",
        url: "http://localhost:3000",
        description: "Test application for ambiguous tenant flow"
    };

    it('should setup Mordor tenant', () => {
        cy.login(`admin@${TENANTS.mordor.domain}`, "admin9000", TENANTS.mordor.domain);
        cy.openTenantOverviewTile();
        cy.addAppFromOverview(TEST_APP.name, TEST_APP.url, TEST_APP.description);
        cy.publishApp(TEST_APP.name);
        cy.logout();
    });

    it('should setup Gondor tenant', () => {
        cy.login(`admin@${TENANTS.gondor.domain}`, "admin9000", TENANTS.gondor.domain);
        cy.openTenantOverviewTile();
        cy.subscribeAppFromOverview(TEST_APP.name);
        cy.addMemberToTenant(TENANTS.gondor.domain, AMBIGUOUS_USER.email, AMBIGUOUS_USER.password);
        cy.logout();
    });

    it('should setup Rohan tenant', () => {
        cy.login(`admin@${TENANTS.rohan.domain}`, "admin9000", TENANTS.rohan.domain);
        cy.openTenantOverviewTile();
        cy.subscribeAppFromOverview(TEST_APP.name);
        cy.addMemberToTenant(TENANTS.rohan.domain, AMBIGUOUS_USER.email, AMBIGUOUS_USER.password);
        cy.logout();
    });

    it('should handle ambiguous tenant selection flow', () => {
        cy.visit(`/authorize?client_id=${TENANTS.mordor.domain}&code_challenge=test&redirect_uri=https://example.com`);

        // 1. Login with ambiguous user
        cy.intercept('POST', '**/api/oauth/login*').as('login');
        cy.intercept('POST', '**/api/oauth/check-tenant-ambiguity*').as('checkAmbiguity');
        cy.intercept('POST', '**/api/oauth/update-subscriber-tenant-hint*').as('updateHint');

        cy.get('#username').type(AMBIGUOUS_USER.email)
        cy.get('#password').type(AMBIGUOUS_USER.password)

        cy.get('#login-btn').click();

        cy.wait('@login').should(({response}) => {
            expect(response?.statusCode).to.be.oneOf([201, 200]);
            expect(response?.body).to.have.property('authentication_code');
        });

        cy.wait('@checkAmbiguity').should(({response}) => {
            expect(response?.statusCode).to.be.oneOf([201, 200]);
            expect(response.body.hasAmbiguity).to.be.true;
            expect(response.body.tenants).to.be.an('array');
            expect(response.body.tenants.length).to.equal(2);
        });

        // 3. Verify tenant selection page
        cy.url().should('include', '/tenant-selection');

        // 4. Select tenant and complete flow
        cy.get('button').contains(TENANTS.gondor.domain).click();

        // 5. Verify the hint update API was called
        cy.wait('@updateHint').should(({request, response}) => {
            expect(response?.statusCode).to.be.oneOf([201, 200]);
            expect(request.body).to.have.property('subscriber_tenant_hint', TENANTS.gondor.domain);
        });

        // 6. Verify successful completion
        cy.url().should('include', 'https://example.com/');
    });

    it('should cleanup Gondor tenant', () => {
        cy.login(`admin@${TENANTS.gondor.domain}`, "admin9000", TENANTS.gondor.domain);
        cy.openTenantOverviewTile();
        cy.unsubscribeFromApp(TEST_APP.name);
        cy.logout();
    });

    it('should cleanup Rohan tenant', () => {
        cy.login(`admin@${TENANTS.rohan.domain}`, "admin9000", TENANTS.rohan.domain);
        cy.openTenantOverviewTile();
        cy.unsubscribeFromApp(TEST_APP.name);
        cy.logout();
    });

    it('should cleanup test app', () => {
        cy.login(`admin@${TENANTS.mordor.domain}`, "admin9000", TENANTS.mordor.domain);
        cy.openTenantOverviewTile()
        cy.deleteAppFromOverview(TEST_APP.name);
        cy.logout();
    });
});
