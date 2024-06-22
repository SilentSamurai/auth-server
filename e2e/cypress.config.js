// const { defineConfig } = require("cypress");

module.exports = {
  e2e: {
    baseUrl: 'http://localhost:9001',
    supportFile: "cypress/support/e2e.js",
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
};