import {defineConfig} from 'cypress'

export default defineConfig({

    e2e: {
        baseUrl: 'http://localhost:4200',
        experimentalStudio: true,
        chromeWebSecurity: false,
        experimentalOriginDependencies: true,
    },


})
