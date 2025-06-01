// ***********************************************
// This example namespace declaration will help
// with Intellisense and code completion in your
// IDE or Text Editor.
// ***********************************************
// declare namespace Cypress {
//   interface Chainable<Subject = any> {
//     customCommand(param: any): typeof customCommand;
//   }
// }
//
// function customCommand(param: any): void {
//   console.warn(param);
// }
//
// NOTE: You can use it like so:
// Cypress.Commands.add('customCommand', customCommand);
//
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
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

// @ts-ignore
Cypress.Commands.add('adminLogin', (email: string, password: string) => {
    cy.visit("/home");
    // cy.get('#domain-pre').type("auth.server.com")

    // After filtering, we can assert that there is only the one
    // incomplete item in the list.
    // cy.get('#continue-btn').click()

    cy.get('#username').type(email);
    cy.get('#password').type(password);

    cy.intercept('POST', '**/api/oauth/token*').as('authCode')

    cy.get('#login-btn').click();

    cy.wait('@authCode').should(({request, response}) => {
        expect(response?.statusCode).to.be.oneOf([201, 200]);
        // expect(response && response.body).to.include('authentication_code')
    })

    cy.url().should('include', '/home');

    // Then assert the page title
    cy.contains('Home');
});

// @ts-ignore
Cypress.Commands.add('login', (email: string, password: string, domain: string) => {
    cy.visit(`/home?client_id=${domain}`);
    // cy.get('#domain-pre').type(tenant)

    // After filtering, we can assert that there is only the one
    // incomplete item in the list.
    // cy.get('#continue-btn').click()

    cy.get('#username').type(email)
    cy.get('#password').type(password)

    cy.intercept('POST', '**/api/oauth/token*').as('authCode')

    cy.get('#login-btn').click();

    cy.wait('@authCode').should(({request, response}) => {
        expect(response?.statusCode).to.be.oneOf([201, 200]);
        // expect(response && response.body).to.include('authentication_code')
    })

    cy.url().should('include', '/home');

    // Then assert the page title
    cy.contains('Home');
});

// @ts-ignore
Cypress.Commands.add('goToTenantObjectPage', (tenantDomain: string) => {
    cy.visit('/home');
    cy.get('#Tenants_HOME_NAV').click();
    cy.get('a[href="/TN02"]').click();
    cy.get('#Tenant-vh-btn').click();
    cy.get('#FILTER_FIELD_domain').type(tenantDomain);
    cy.get('#default_FILTER_BAR_GO_BTN').click();
    cy.contains('td', tenantDomain).click();
    cy.get('#Tenant_VH_SELECT_BTN').click();
    cy.intercept('GET', '**/api/tenant/*/members').as('getTenantDetails');
    cy.get('#TN02_SEL_CONT_BTN').click();
    cy.url().should('match', /TN02\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/);
    cy.wait('@getTenantDetails').should(({request, response}) => {
        expect(response && response.statusCode).to.be.oneOf([200, 304]);
    });
});


// @ts-ignore
Cypress.Commands.add('createTenant', (tenantName: string, tenantDomain: string) => {
    cy.visit('/');
    cy.url().should('include', '/home');
    cy.get('#Tenants_HOME_NAV').click();
    cy.get('a[href="/TN01"]').click();
    cy.get('#CREATE_TENANT_DIALOG_BTN').click();
    cy.get('#create\\.tenant\\.name').type(tenantName);
    cy.get('#create\\.tenant\\.domain').type(tenantDomain);
    cy.intercept('POST', '**/tenant/create*').as('createTenant');
    cy.get('#CREATE_TENANT_SUBMIT_BTN').click();
    cy.wait('@createTenant').should(({request, response}) => {
        expect(response && response.statusCode).to.be.oneOf([201]);
    });
});

// @ts-ignore
Cypress.Commands.add('deleteTenant', (tenantDomain: string) => {

    cy.goToTenantObjectPage(tenantDomain);

    cy.get('#DELETE_TENANT_BTN').click();
    cy.intercept('DELETE', '**/api/tenant/*').as('DeleteTenant');
    cy.get('#CONFIRMATION_YES_BTN').click();
    cy.wait('@DeleteTenant').should(({request, response}) => {
        expect(response && response.statusCode).to.be.oneOf([200]);
    });
});

// @ts-ignore
Cypress.Commands.add('subscribeToApp', (tenantDomain: string, appName: string) => {
    cy.goToTenantObjectPage(tenantDomain);
    cy.subscribeAppFromOverview(appName);
});

Cypress.Commands.add('subscribeAppFromOverview', (appName: string) => {
    cy.contains('button', 'Subscriptions').click();
    cy.get('#CREATE_SUBSCRIPTION_BTN').click();
    cy.get('.modal-body')
        .contains('td', appName)
        .parent()
        .find('button')
        .contains('Select').click();

    cy.intercept('POST', '**/api/apps/*/subscribe/*').as('SubscribeApp');

    cy.get('#SUBSCRIBE_BTN').click();


    cy.wait('@SubscribeApp').should(({request, response}) => {
        expect(response && (response.statusCode === 201 || response.statusCode === 200)).to.be.true;
    });
    cy.contains('td', appName).should('exist');
});

// @ts-ignore
Cypress.Commands.add('addAppToTenant', (domain: string, appName: string, appUrl: string, description: string) => {

    cy.goToTenantObjectPage(domain);
    cy.addAppFromOverview(appName, appUrl, description);
});

Cypress.Commands.add('addAppFromOverview', (appName: string, appUrl: string, description: string) => {

    // Go to the Apps section (assumes already on the tenant object page)
    cy.contains('button', 'Apps').click();
    cy.contains('button', 'Create').click();

    cy.get('input[name="name"]').type(appName);
    cy.get('input[name="appUrl"]').type(appUrl);
    cy.get('textarea[name="description"]').type(description);

    cy.intercept('POST', '**/api/apps/create').as('CreateApp');

    cy.get('.modal-footer').contains('button', 'Create').click();

    cy.wait('@CreateApp').should(({request, response}) => {
        expect(response && response.statusCode).to.be.oneOf([201, 200]);
    });

    cy.contains("td", appName).should("exist");
});

// @ts-ignore
Cypress.Commands.add('openTenantOverviewTile', () => {
    cy.visit('/home');
    cy.contains('app-tile', 'Tenant Overview').click();
});

// @ts-ignore
Cypress.Commands.add('openSubscribedApp', (appName: string) => {
    cy.contains('button', 'Subscriptions').click();
    cy.contains('td', appName)
        .parent()
        .find('button')
        .contains('View App')
        .click();
});

// @ts-ignore
Cypress.Commands.add('unsubscribeFromApp', (appName: string) => {
    cy.contains('button', 'Subscriptions').click();
    cy.contains('td', appName)
        .parent()
        .find('button')
        .filter((i, el) => el.innerHTML.includes('fa-trash'))
        .click();

    cy.intercept('POST', '**/api/apps/*/unsubscribe/*').as('UnsubscribeApp');

    cy.get('#CONFIRMATION_YES_BTN').click();


    cy.wait('@UnsubscribeApp').should(({request, response}) => {
        expect(response && (response.statusCode === 200 || response.statusCode === 201)).to.be.true;
    });

    cy.contains('td', appName).should('not.exist');
});

// @ts-ignore
Cypress.Commands.add('deleteAppFromOverview', (appName: string) => {
    cy.contains('button', 'Apps').click();
    cy.contains('td', appName)
        .parent()
        .find('button[data-test-id="delete"]')
        .click();
    cy.intercept('DELETE', '**/api/apps/*').as('DeleteApp');
    cy.get('#CONFIRMATION_YES_BTN').click();
    cy.wait('@DeleteApp').should(({request, response}) => {
        expect(response && (response.statusCode === 200 || response.statusCode === 201)).to.be.true;
    });
    cy.contains('td', appName).should('not.exist');
});

// @ts-ignore
Cypress.Commands.add('loginWithAmbiguousUser', (email: string, password: string, clientId: string) => {
    cy.visit('/');
    cy.get('#username').type(email);
    cy.get('#password').type(password);
    cy.intercept('POST', '**/api/oauth/login*').as('login');
    cy.get('#login-btn').click();
    return cy.wait('@login');
});

// @ts-ignore
Cypress.Commands.add('addMemberToTenant', (tenantDomain: string, email: string, password: string) => {
    cy.openTenantOverviewTile();
    cy.contains('button', 'Members').click();
    cy.get('#OPEN_ADD_MEMBER_DIALOG_BTN').click();
    cy.get('#add\\.member\\.name').type(email);
    cy.intercept('POST', '**/api/tenant/*/members/add').as('createMember');
    cy.get('#ADD_TENANT_MEMBER_BTN').click();
    cy.wait('@createMember').should(({response}) => {
        expect(response?.statusCode).to.be.oneOf([201]);
    });
    cy.contains('td', email).should('exist');
});

// @ts-ignore
Cypress.Commands.add('publishApp', (appName: string) => {
    cy.openTenantOverviewTile();
    cy.contains('button', 'Apps').click();
    cy.contains('td', appName)
        .parent()
        .find('button')
        .contains('Publish')
        .click();
    cy.intercept('PATCH', '**/api/apps/*/publish').as('publishApp');
    cy.get('#CONFIRMATION_YES_BTN').click();
    cy.wait('@publishApp').should(({response}) => {
        expect(response?.statusCode).to.be.oneOf([200, 201]);
    });
    // Verify app is published by checking that the Publish button is gone
    cy.contains('td', appName)
        .parent()
        .find('button')
        .contains('Publish')
        .should('not.exist');
});

Cypress.Commands.add('logout', () => {
    cy.get('#dropdownUser1').click();
    cy.contains('a.dropdown-item', 'Sign Out').click();
    cy.url().should('include', '/login');
});

declare namespace Cypress {
    interface Chainable<Subject = any> {
        addAppFromOverview(appName: string, appUrl: string, description: string): Chainable<any>;

        subscribeAppFromOverview(appName: string): Chainable<any>;

        goToTenantObjectPage(tenantDomain: string): Chainable<any>;

        createTenant(tenantName: string, tenantDomain: string): Chainable<any>;

        deleteTenant(tenantDomain: string): Chainable<any>;

        subscribeToApp(tenantDomain: string, appName: string): Chainable<any>;

        openTenantOverviewTile(): Chainable<any>;

        openSubscribedApp(appName: string): Chainable<any>;

        unsubscribeFromApp(appName: string): Chainable<any>;

        deleteAppFromOverview(appName: string): Chainable<any>;

        adminLogin(email: string, password: string): Chainable<any>;

        login(email: string, password: string, domain: string): Chainable<any>;
        loginWithAmbiguousUser(email: string, password: string, clientId: string): Chainable<any>;
        addMemberToTenant(tenantDomain: string, email: string, password: string): Chainable<any>;
        publishApp(appName: string): Chainable<any>;
        logout(): Chainable<any>;
    }
}


