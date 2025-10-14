/// <reference types="cypress" />

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
