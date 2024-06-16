const puppeteer = require('puppeteer-core')
const {homedir} = require("node:os");

// or import puppeteer from 'puppeteer-core';

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
        await page.goto('http://localhost:9001/');
        await page.setViewport({width: 1080, height: 1024});
    });

    afterAll(async () => {
    });

    afterEach(async () => {
        await browser.close();
    });


    it(`Admin Login`, async () => {
        // Wait and click on first result.
        await page.waitForSelector('#domain-pre');
        await page.type('#domain-pre', 'auth.server.com');

        await page.click('#continue-btn');

        await page.waitForSelector('#email');
        await page.type('#email', 'admin@auth.server.com');
        await page.type('#password', 'admin9000');

        await page.click('#login-btn');

        // Locate the full title with a unique string.
        const seltor = await page.waitForSelector('app-launchpad', {visible: true});

        expect(await page.$('app-launchpad')).not.toBeNull();
    });

    it(`Login`, async () => {
        // Wait and click on first result.
        await page.waitForSelector('#domain-pre');
        await page.type('#domain-pre', 'auth.server.com');

        await page.click('#continue-btn');

        await page.waitForSelector('#email');
        await page.type('#email', 'boromir@mail.com');
        await page.type('#password', 'boromir9000');

        await page.click('#login-btn');

        // Locate the full title with a unique string.
        const seltor = await page.waitForSelector('app-launchpad', {visible: true});

        expect(await page.$('app-launchpad')).not.toBeNull();
    });
});
