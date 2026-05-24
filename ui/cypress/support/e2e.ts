/// <reference path="./commands.d.ts" />

// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// When a command from ./commands is ready to use, import with `import './commands'` syntax
import './commands';

// Unified OAuth Authorization UI — exports visitAuthorize, interceptAll,
// assertNoCredentialLeak helpers consumed by ui/cypress/e2e/unified-authorize/*.
import './unified-authorize';

// Hide PrimeNG toast notifications in tests — they overlap modals and block element clicks.
const HIDE_TOAST_CSS = 'p-toast { display: none !important; }';
Cypress.on('window:before:load', (win) => {
    const style = win.document.createElement('style');
    style.id = 'cypress-toast-hide';
    style.textContent = HIDE_TOAST_CSS;
    win.document.head.appendChild(style);
});
