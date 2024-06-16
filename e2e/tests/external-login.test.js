const puppeteer = require('puppeteer-core')
const {homedir} = require("node:os");


describe('e2e Auth', () => {
    let page;
    let browser;
    beforeAll(async () => {
    });

    beforeEach(async () => {
        browser = await puppeteer.launch({
            headless: true,
            executablePath: `C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe`
        });
        page = await browser.newPage();
        await page.goto('http://localhost:3000/external-auth-test.html');
        await page.setViewport({width: 1080, height: 1024});
    });

    afterAll(async () => {
    });

    afterEach(async () => {
        await browser.close();
    });


    it(`External Login`, async () => {
        // Wait and click on first result.
        // Wait and click on first result.
        await page.waitForSelector('#login-btn');
        await page.click('#login-btn');


        // await page.waitForSelector('#domain-pre');
        // await page.type('#domain-pre', 'auth.server.com');

        // await page.click('#continue-btn');

        await page.waitForSelector('#email');
        await page.type('#email', 'admin@auth.server.com');
        await page.type('#password', 'admin9000');


        await page.click('#login-btn');

        await page.waitForNetworkIdle({idleTime: 2500});


        const emailIncluded = await page.evaluate(() => {
            const string = 'admin@auth.server.com';
            const selector = '#decodedToken';
            return document.querySelector(selector).innerText.includes(string);
        });

        expect(emailIncluded).toBeTruthy();

        const domainIncluded = await page.evaluate(() => {
            const string = 'dummy.com';
            const selector = '#decodedToken';
            return document.querySelector(selector).innerText.includes(string);
        });

        expect(domainIncluded).toBeTruthy();

    });

});
