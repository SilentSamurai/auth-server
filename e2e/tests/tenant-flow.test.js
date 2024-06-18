const puppeteer = require('puppeteer-core')
const {homedir} = require("node:os");
const helper = require('./helper');

// or import puppeteer from 'puppeteer-core';

describe('e2e Tenant Flow', () => {
    let page;
    let browser;
    let TenantName = 'Test Tenant';
    let TenantDomain = "test-tenant.com"
    const TenantUpdateName = 'Test Updated Tenant';
    const timeout = 5000;

    beforeAll(async () => {
        browser = await puppeteer.launch({
            headless: false,
            executablePath: `C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe`
        });

        page = await browser.newPage();
        await page.goto('http://localhost:9001/');
        await page.setViewport({width: 1080, height: 1024});

        await helper.LoginHelper.adminLogin(page);

    });

    beforeEach(async () => {
        page = await browser.newPage();
        await page.goto('http://localhost:9001/');
        await page.setViewport({width: 1080, height: 1024});
    });

    afterAll(async () => {
        await browser.close();
    });

    afterEach(async () => {

    });

    it(`DMY`, async () => {

    });

    it(`Create Tenant`, async () => {
        {
            const targetPage = page;
            const promises = [];
            const startWaitingForEvents = () => {
                promises.push(targetPage.waitForNavigation());
            }
            startWaitingForEvents();
            await targetPage.goto('http://localhost:9001/home');
            await Promise.all(promises);
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('div:nth-of-type(2) > app-tile-group > div > div:nth-of-type(1) div.tile-body-md'),
                targetPage.locator('::-p-xpath(//*[@id=\\"app\\"]/app-home/app-launchpad/div[2]/div[2]/app-tile-group/div/div[1]/a/app-tile/div/div/div[2])'),
                targetPage.locator(':scope >>> div:nth-of-type(2) > app-tile-group > div > div:nth-of-type(1) div.tile-body-md'),
                targetPage.locator('::-p-text(Manage All Tenants)')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 58.11111068725586,
                        y: 21.72222900390625,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria( Create Tenant)'),
                targetPage.locator('app-page-view > div > div.card div > div > div > div > button'),
                targetPage.locator('::-p-xpath(//*[@id=\\"app\\"]/app-tn01/app-page-view/div/div[1]/div/div/div/div/div/button)'),
                targetPage.locator(':scope >>> app-page-view > div > div.card div > div > div > div > button'),
                targetPage.locator('::-p-text(Create Tenant)')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 55.388916015625,
                        y: 18.111114501953125,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(Name[role=\\"textbox\\"])'),
                targetPage.locator('#create\\.tenant\\.name'),
                targetPage.locator('::-p-xpath(//*[@id=\\"create.tenant.name\\"])'),
                targetPage.locator(':scope >>> #create\\.tenant\\.name')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 117.77777099609375,
                        y: 34.22221374511719,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(Name[role=\\"textbox\\"])'),
                targetPage.locator('#create\\.tenant\\.name'),
                targetPage.locator('::-p-xpath(//*[@id=\\"create.tenant.name\\"])'),
                targetPage.locator(':scope >>> #create\\.tenant\\.name')
            ])
                .setTimeout(timeout)
                .fill(TenantName);
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(Domain[role=\\"textbox\\"])'),
                targetPage.locator('#create\\.tenant\\.domain'),
                targetPage.locator('::-p-xpath(//*[@id=\\"create.tenant.domain\\"])'),
                targetPage.locator(':scope >>> #create\\.tenant\\.domain')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 34.77777099609375,
                        y: 21.444442749023438,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(Domain[role=\\"textbox\\"])'),
                targetPage.locator('#create\\.tenant\\.domain'),
                targetPage.locator('::-p-xpath(//*[@id=\\"create.tenant.domain\\"])'),
                targetPage.locator(':scope >>> #create\\.tenant\\.domain')
            ])
                .setTimeout(timeout)
                .fill(TenantDomain);
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('div.modal-body'),
                targetPage.locator('::-p-xpath(/html/body/ngb-modal-window/div/div/app-create-tenant/div[2])'),
                targetPage.locator(':scope >>> div.modal-body')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 36.77777099609375,
                        y: 232.22222137451172,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(Create)'),
                targetPage.locator('div.modal-body button'),
                targetPage.locator('::-p-xpath(/html/body/ngb-modal-window/div/div/app-create-tenant/div[2]/form/button)'),
                targetPage.locator(':scope >>> div.modal-body button')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 33.77777099609375,
                        y: 28.666656494140625,
                    },
                });
        }


    });

    it(`Get Tenant`, async () => {
        {
            const targetPage = page;
            await targetPage.setViewport({
                width: 1688,
                height: 781
            })
        }
        {
            const targetPage = page;
            const promises = [];
            const startWaitingForEvents = () => {
                promises.push(targetPage.waitForNavigation());
            }
            startWaitingForEvents();
            await targetPage.goto('http://localhost:9001/home');
            await Promise.all(promises);
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(Tenants) >>>> ::-p-aria([role=\\"strong\\"])'),
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 23.638885498046875,
                        y: 20.22222137451172,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('div:nth-of-type(2) > app-tile-group > div > div:nth-of-type(2) div.tile-body-md'),
                targetPage.locator('::-p-xpath(//*[@id=\\"app\\"]/app-home/app-launchpad/div[2]/div[2]/app-tile-group/div/div[2]/a/app-tile/div/div/div[2])'),
                targetPage.locator(':scope >>> div:nth-of-type(2) > app-tile-group > div > div:nth-of-type(2) div.tile-body-md'),
                targetPage.locator('::-p-text(Display Tenant)')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 74.11111450195312,
                        y: 19.388885498046875,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria()'),
                targetPage.locator('app-value-help-input button'),
                targetPage.locator('::-p-xpath(//*[@id=\\"app\\"]/app-role-list/div/div/div[2]/form/app-value-help-input/div/button)'),
                targetPage.locator(':scope >>> app-value-help-input button')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 7.90277099609375,
                        y: 30.208328247070312,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('div.col-md-11 > div > div:nth-of-type(2) input'),
                targetPage.locator('::-p-xpath(/html/body/ngb-modal-window/div/div/app-value-help/div[1]/div[2]/div/app-fb/div/div[1]/div/div[2]/app-filter-field/div/div[2]/div/input)'),
                targetPage.locator(':scope >>> div.col-md-11 > div > div:nth-of-type(2) input')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 73.77777099609375,
                        y: 13.333335876464844,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('div.col-md-11 > div > div:nth-of-type(2) input'),
                targetPage.locator('::-p-xpath(/html/body/ngb-modal-window/div/div/app-value-help/div[1]/div[2]/div/app-fb/div/div[1]/div/div[2]/app-filter-field/div/div[2]/div/input)'),
                targetPage.locator(':scope >>> div.col-md-11 > div > div:nth-of-type(2) input')
            ])
                .setTimeout(timeout)
                .fill(TenantDomain);
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(Go)'),
                targetPage.locator('div.modal-header button.btn-primary'),
                targetPage.locator('::-p-xpath(/html/body/ngb-modal-window/div/div/app-value-help/div[1]/div[2]/div/app-fb/div/div[2]/div/button[1])'),
                targetPage.locator(':scope >>> div.modal-header button.btn-primary'),
                targetPage.locator('::-p-text(Go)')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 14.9444580078125,
                        y: 0.33333587646484375,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(test-tenant.com)'),
                targetPage.locator('td:nth-of-type(3)'),
                targetPage.locator('::-p-xpath(//*[@id=\\"pr_id_6-table\\"]/tbody/tr/td[3])'),
                targetPage.locator(':scope >>> td:nth-of-type(3)')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 92.66668701171875,
                        y: 24.888885498046875,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(Select)'),
                targetPage.locator('div.modal-footer > button.btn-primary'),
                targetPage.locator('::-p-xpath(/html/body/ngb-modal-window/div/div/app-value-help/div[3]/button[2])'),
                targetPage.locator(':scope >>> div.modal-footer > button.btn-primary')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 40.0277099609375,
                        y: 5.13885498046875,
                    },
                });
        }
        {
            await helper.LoginHelper.delay(1000);
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(Continue)'),
                targetPage.locator('#TN02-SEL-CONT-BTN'),
                targetPage.locator('::-p-xpath(//*[@id=\\"TN02-SEL-CONT-BTN\\"])'),
                targetPage.locator(':scope >>> #TN02-SEL-CONT-BTN'),
                targetPage.locator('::-p-text(Continue)')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 37,
                        y: 15.430557250976562,
                    },
                });
        }

    });

    it(`Update Tenant`, async () => {
        {
            const targetPage = page;
            await targetPage.setViewport({
                width: 1688,
                height: 781
            })
        }
        {
            const targetPage = page;
            const promises = [];
            const startWaitingForEvents = () => {
                promises.push(targetPage.waitForNavigation());
            }
            startWaitingForEvents();
            await targetPage.goto('http://localhost:9001/home');
            await Promise.all(promises);
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(Tenants) >>>> ::-p-aria([role=\\"strong\\"])'),
                targetPage.locator('li:nth-of-type(2) strong'),
                targetPage.locator('::-p-xpath(//*[@id=\\"app\\"]/app-home/app-launchpad/div[1]/ul/li[2]/button/strong)'),
                targetPage.locator(':scope >>> li:nth-of-type(2) strong')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 41.638885498046875,
                        y: 13.222221374511719,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('div:nth-of-type(2) > app-tile-group > div > div:nth-of-type(2) div.tile-body-md'),
                targetPage.locator('::-p-xpath(//*[@id=\\"app\\"]/app-home/app-launchpad/div[2]/div[2]/app-tile-group/div/div[2]/a/app-tile/div/div/div[2])'),
                targetPage.locator(':scope >>> div:nth-of-type(2) > app-tile-group > div > div:nth-of-type(2) div.tile-body-md'),
                targetPage.locator('::-p-text(Display Tenant)')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 127.11111450195312,
                        y: 49.388885498046875,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria()'),
                targetPage.locator('app-value-help-input button'),
                targetPage.locator('::-p-xpath(//*[@id=\\"app\\"]/app-role-list/div/div/div[2]/form/app-value-help-input/div/button)'),
                targetPage.locator(':scope >>> app-value-help-input button')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 34.90277099609375,
                        y: 21.208328247070312,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('div.col-md-11 > div > div:nth-of-type(2) input'),
                targetPage.locator('::-p-xpath(/html/body/ngb-modal-window/div/div/app-value-help/div[1]/div[2]/div/app-fb/div/div[1]/div/div[2]/app-filter-field/div/div[2]/div/input)'),
                targetPage.locator(':scope >>> div.col-md-11 > div > div:nth-of-type(2) input')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 59.77777099609375,
                        y: 16.333335876464844,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('div.col-md-11 > div > div:nth-of-type(2) input'),
                targetPage.locator('::-p-xpath(/html/body/ngb-modal-window/div/div/app-value-help/div[1]/div[2]/div/app-fb/div/div[1]/div/div[2]/app-filter-field/div/div[2]/div/input)'),
                targetPage.locator(':scope >>> div.col-md-11 > div > div:nth-of-type(2) input')
            ])
                .setTimeout(timeout)
                .fill('test-tenant.com');
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(Go)'),
                targetPage.locator('div.modal-header button.btn-primary'),
                targetPage.locator('::-p-xpath(/html/body/ngb-modal-window/div/div/app-value-help/div[1]/div[2]/div/app-fb/div/div[2]/div/button[1])'),
                targetPage.locator(':scope >>> div.modal-header button.btn-primary'),
                targetPage.locator('::-p-text(Go)')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 22.9444580078125,
                        y: 21.333335876464844,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(test-tenant.com)'),
                targetPage.locator('td:nth-of-type(3)'),
                targetPage.locator('::-p-xpath(//*[@id=\\"pr_id_5-table\\"]/tbody/tr/td[3])'),
                targetPage.locator(':scope >>> td:nth-of-type(3)')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 169.66668701171875,
                        y: 1.888885498046875,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(Select)'),
                targetPage.locator('div.modal-footer > button.btn-primary'),
                targetPage.locator('::-p-xpath(/html/body/ngb-modal-window/div/div/app-value-help/div[3]/button[2])'),
                targetPage.locator(':scope >>> div.modal-footer > button.btn-primary')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 40.0277099609375,
                        y: 19.13885498046875,
                    },
                });
        }
        {
            await helper.LoginHelper.delay(1000);
        }
        {
            const targetPage = page;
            await targetPage.click('#TN02_SEL_CONT_BTN');
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(Update)'),
                targetPage.locator('div.card > div > div.ng-star-inserted button'),
                targetPage.locator('::-p-xpath(//*[@id=\\"app\\"]/view-tenant/app-object-page/div/div[1]/div/div[1]/div/div/div[2]/button)'),
                targetPage.locator(':scope >>> div.card > div > div.ng-star-inserted button')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 42.0694580078125,
                        y: 19.111106872558594,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(Name)'),
                targetPage.locator('#update\\.tenant\\.name'),
                targetPage.locator('::-p-xpath(//*[@id=\\"update.tenant.name\\"])'),
                targetPage.locator(':scope >>> #update\\.tenant\\.name')
            ])
                .setTimeout(timeout)
                .fill(TenantUpdateName);
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria([role=\\"document\\"]) >>>> ::-p-aria(Update)'),
                targetPage.locator('div.modal-body button'),
                targetPage.locator('::-p-xpath(/html/body/ngb-modal-window/div/div/app-update-tenant/div[2]/form/button)'),
                targetPage.locator(':scope >>> div.modal-body button')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 25.77777099609375,
                        y: 8.666656494140625,
                    },
                });
        }
    });

    it(`Add member`, async () => {
        {
            const targetPage = page;
            await targetPage.setViewport({
                width: 1072,
                height: 1021
            })
        }
        {
            const targetPage = page;
            const promises = [];
            const startWaitingForEvents = () => {
                promises.push(targetPage.waitForNavigation());
            }
            startWaitingForEvents();
            await targetPage.goto('http://localhost:9001/home');
            await Promise.all(promises);
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(Tenants) >>>> ::-p-aria([role=\\"strong\\"])'),
                targetPage.locator('li:nth-of-type(2) strong'),
                targetPage.locator('::-p-xpath(//*[@id=\\"app\\"]/app-home/app-launchpad/div[1]/ul/li[2]/button/strong)'),
                targetPage.locator(':scope >>> li:nth-of-type(2) strong')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 32.982635498046875,
                        y: 7.961799621582031,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('div:nth-of-type(2) > app-tile-group > div > div:nth-of-type(2) div.tile-body-md'),
                targetPage.locator('::-p-xpath(//*[@id=\\"app\\"]/app-home/app-launchpad/div[2]/div[2]/app-tile-group/div/div[2]/a/app-tile/div/div/div[2])'),
                targetPage.locator(':scope >>> div:nth-of-type(2) > app-tile-group > div > div:nth-of-type(2) div.tile-body-md'),
                targetPage.locator('::-p-text(Display Tenant)')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 93.91665649414062,
                        y: 14.489578247070312,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria()'),
                targetPage.locator('app-value-help-input button'),
                targetPage.locator('::-p-xpath(//*[@id=\\"app\\"]/app-role-list/div/div/div[2]/form/app-value-help-input/div/button)'),
                targetPage.locator(':scope >>> app-value-help-input button')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 37.52081298828125,
                        y: 11.6875,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('div.col-md-11 > div > div:nth-of-type(2) input'),
                targetPage.locator('::-p-xpath(/html/body/ngb-modal-window/div/div/app-value-help/div[1]/div[2]/div/app-fb/div/div[1]/div/div[2]/app-filter-field/div/div[2]/div/input)'),
                targetPage.locator(':scope >>> div.col-md-11 > div > div:nth-of-type(2) input')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 99.35067749023438,
                        y: 14.722213745117188,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('div.col-md-11 > div > div:nth-of-type(2) input'),
                targetPage.locator('::-p-xpath(/html/body/ngb-modal-window/div/div/app-value-help/div[1]/div[2]/div/app-fb/div/div[1]/div/div[2]/app-filter-field/div/div[2]/div/input)'),
                targetPage.locator(':scope >>> div.col-md-11 > div > div:nth-of-type(2) input')
            ])
                .setTimeout(timeout)
                .fill('Test-tenant.com');
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(Go)'),
                targetPage.locator('div.modal-header button.btn-primary'),
                targetPage.locator('::-p-xpath(/html/body/ngb-modal-window/div/div/app-value-help/div[1]/div[2]/div/app-fb/div/div[2]/div/button[1])'),
                targetPage.locator(':scope >>> div.modal-header button.btn-primary'),
                targetPage.locator('::-p-text(Go)')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 8.76385498046875,
                        y: 13.732635498046875,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(test-tenant.com)'),
                targetPage.locator('td:nth-of-type(3)'),
                targetPage.locator('::-p-xpath(//*[@id=\\"pr_id_4-table\\"]/tbody/tr/td[3])'),
                targetPage.locator(':scope >>> td:nth-of-type(3)'),
                targetPage.locator('::-p-text(test-tenant.com)')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 201.44439697265625,
                        y: 14.048599243164062,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(Select)'),
                targetPage.locator('div.modal-footer > button.btn-primary'),
                targetPage.locator('::-p-xpath(/html/body/ngb-modal-window/div/div/app-value-help/div[3]/button[2])'),
                targetPage.locator(':scope >>> div.modal-footer > button.btn-primary')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 28.42706298828125,
                        y: 10.2291259765625,
                    },
                });
        }
        {
            await helper.LoginHelper.delay(1000);
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(Continue)'),
                targetPage.locator('#TN02_SEL_CONT_BTN'),
                targetPage.locator('::-p-xpath(//*[@id=\\"TN02_SEL_CONT_BTN\\"])'),
                targetPage.locator(':scope >>> #TN02_SEL_CONT_BTN'),
                targetPage.locator('::-p-text(Continue)')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 26.604156494140625,
                        y: 3.4860992431640625,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(Add Member)'),
                targetPage.locator('div.container > div:nth-of-type(1) div.p-datatable-header button'),
                targetPage.locator('::-p-xpath(//*[@id=\\"pr_id_5\\"]/div[1]/div/button)'),
                targetPage.locator(':scope >>> div.container > div:nth-of-type(1) div.p-datatable-header button'),
                targetPage.locator('::-p-text(Add Member)')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 47.9166259765625,
                        y: 21.579833984375,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(Email)'),
                targetPage.locator('#add\\.member\\.name'),
                targetPage.locator('::-p-xpath(//*[@id=\\"add.member.name\\"])'),
                targetPage.locator(':scope >>> #add\\.member\\.name')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 153.34375,
                        y: 18.3055419921875,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(Email)'),
                targetPage.locator('#add\\.member\\.name'),
                targetPage.locator('::-p-xpath(//*[@id=\\"add.member.name\\"])'),
                targetPage.locator(':scope >>> #add\\.member\\.name')
            ])
                .setTimeout(timeout)
                .fill('boromir@mail.com');
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria([role=\\"document\\"]) >>>> ::-p-aria(Add Member[role=\\"button\\"])'),
                targetPage.locator('div.modal-body button'),
                targetPage.locator('::-p-xpath(/html/body/ngb-modal-window/div/div/app-add-member/div[2]/form/button)'),
                targetPage.locator(':scope >>> div.modal-body button')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 87.34375,
                        y: 30.138885498046875,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('tr:nth-of-type(2) a'),
                targetPage.locator('::-p-xpath(//*[@id=\\"pr_id_5-table\\"]/tbody/tr[2]/td[3]/a)'),
                targetPage.locator(':scope >>> tr:nth-of-type(2) a')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 61.49652099609375,
                        y: 7.2291259765625,
                    },
                });
        }
    });

    it(`Create Tenant Role`, async () => {

    });

    it(`Delete Tenant`, async () => {
        {
            const targetPage = page;
            await targetPage.setViewport({
                width: 1688,
                height: 781
            })
        }
        {
            const targetPage = page;
            const promises = [];
            const startWaitingForEvents = () => {
                promises.push(targetPage.waitForNavigation());
            }
            startWaitingForEvents();
            await targetPage.goto('http://localhost:9001/home');
            await Promise.all(promises);
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(Tenants) >>>> ::-p-aria([role=\\"strong\\"])'),
                targetPage.locator('li:nth-of-type(2) strong'),
                targetPage.locator('::-p-xpath(//*[@id=\\"app\\"]/app-home/app-launchpad/div[1]/ul/li[2]/button/strong)'),
                targetPage.locator(':scope >>> li:nth-of-type(2) strong')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 0.638885498046875,
                        y: 4.222221374511719,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('div:nth-of-type(2) > app-tile-group > div > div:nth-of-type(2) div.tile-body-md'),
                targetPage.locator('::-p-xpath(//*[@id=\\"app\\"]/app-home/app-launchpad/div[2]/div[2]/app-tile-group/div/div[2]/a/app-tile/div/div/div[2])'),
                targetPage.locator(':scope >>> div:nth-of-type(2) > app-tile-group > div > div:nth-of-type(2) div.tile-body-md'),
                targetPage.locator('::-p-text(Display Tenant)')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 43.111114501953125,
                        y: 10.388885498046875,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria()'),
                targetPage.locator('app-value-help-input button'),
                targetPage.locator('::-p-xpath(//*[@id=\\"app\\"]/app-role-list/div/div/div[2]/form/app-value-help-input/div/button)'),
                targetPage.locator(':scope >>> app-value-help-input button')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 10.90277099609375,
                        y: 25.208328247070312,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('div.col-md-11 > div > div:nth-of-type(2) input'),
                targetPage.locator('::-p-xpath(/html/body/ngb-modal-window/div/div/app-value-help/div[1]/div[2]/div/app-fb/div/div[1]/div/div[2]/app-filter-field/div/div[2]/div/input)'),
                targetPage.locator(':scope >>> div.col-md-11 > div > div:nth-of-type(2) input')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 106.77777099609375,
                        y: 8.333335876464844,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('div.col-md-11 > div > div:nth-of-type(2) input'),
                targetPage.locator('::-p-xpath(/html/body/ngb-modal-window/div/div/app-value-help/div[1]/div[2]/div/app-fb/div/div[1]/div/div[2]/app-filter-field/div/div[2]/div/input)'),
                targetPage.locator(':scope >>> div.col-md-11 > div > div:nth-of-type(2) input')
            ])
                .setTimeout(timeout)
                .fill(TenantDomain);
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(Go)'),
                targetPage.locator('div.modal-header button.btn-primary'),
                targetPage.locator('::-p-xpath(/html/body/ngb-modal-window/div/div/app-value-help/div[1]/div[2]/div/app-fb/div/div[2]/div/button[1])'),
                targetPage.locator(':scope >>> div.modal-header button.btn-primary'),
                targetPage.locator('::-p-text(Go)')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 11.9444580078125,
                        y: 18.333335876464844,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator(`::-p-aria(${TenantDomain})`),
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 166.66668701171875,
                        y: 18.888885498046875,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(Select)'),
                targetPage.locator('div.modal-footer > button.btn-primary'),
                targetPage.locator('::-p-xpath(/html/body/ngb-modal-window/div/div/app-value-help/div[3]/button[2])'),
                targetPage.locator(':scope >>> div.modal-footer > button.btn-primary')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 38.0277099609375,
                        y: 11.13885498046875,
                    },
                });
        }
        {
            await helper.LoginHelper.delay(1000);
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(Continue)'),
                targetPage.locator('#TN02_SEL_CONT_BTN'),
                targetPage.locator('::-p-xpath(//*[@id=\\"TN02_SEL_CONT_BTN\\"])'),
                targetPage.locator(':scope >>> #TN02_SEL_CONT_BTN'),
                targetPage.locator('::-p-text(Continue)')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 45,
                        y: 23.430557250976562,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('div.col-lg-5 > app-attribute:nth-of-type(2) span:nth-of-type(2)'),
                targetPage.locator('::-p-xpath(//*[@id=\\"app\\"]/view-tenant/app-object-page/div/div[1]/div/div[2]/div/div/div[1]/app-attribute[2]/div/span[2])'),
                targetPage.locator(':scope >>> div.col-lg-5 > app-attribute:nth-of-type(2) span:nth-of-type(2)'),
                targetPage.locator('::-p-text(cf1087cb-8566-41a2-9f8d-9a257bf268b6)')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 260.84722900390625,
                        y: 18.319442749023438,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(Delete Tenant)'),
                targetPage.locator('button.btn-danger'),
                targetPage.locator('::-p-xpath(//*[@id=\\"app\\"]/view-tenant/app-object-page/div/div[1]/div/div[1]/div/div/div[2]/button[2])'),
                targetPage.locator(':scope >>> button.btn-danger'),
                targetPage.locator('::-p-text(Delete Tenant)')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 29.5416259765625,
                        y: 8.111106872558594,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('div.modal-body > div'),
                targetPage.locator('::-p-xpath(/html/body/ngb-modal-window/div/div/delete-tenant-modal/div[2]/div)'),
                targetPage.locator(':scope >>> div.modal-body > div'),
                targetPage.locator('::-p-text(No Yes)')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 349.77777099609375,
                        y: 25.444442749023438,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(Yes)'),
                targetPage.locator('ngb-modal-window button.btn-primary'),
                targetPage.locator('::-p-xpath(/html/body/ngb-modal-window/div/div/delete-tenant-modal/div[2]/div/button[2])'),
                targetPage.locator(':scope >>> ngb-modal-window button.btn-primary'),
                targetPage.locator('::-p-text(Yes)')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 37.65277099609375,
                        y: 20.444442749023438,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('div:nth-of-type(2) > app-tile-group > div > div:nth-of-type(1) div.tile-body-md'),
                targetPage.locator('::-p-xpath(//*[@id=\\"app\\"]/app-home/app-launchpad/div[2]/div[2]/app-tile-group/div/div[1]/a/app-tile/div/div/div[2])'),
                targetPage.locator(':scope >>> div:nth-of-type(2) > app-tile-group > div > div:nth-of-type(1) div.tile-body-md'),
                targetPage.locator('::-p-text(Manage All Tenants)')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 93.11111068725586,
                        y: 7.72222900390625,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria( TN01: Manage Tenants)'),
                targetPage.locator('nav > a'),
                targetPage.locator('::-p-xpath(//*[@id=\\"app\\"]/app-tn01/nav-bar/nav/a)'),
                targetPage.locator(':scope >>> nav > a'),
                targetPage.locator('::-p-text(TN01: Manage)')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 205,
                        y: 28.11111068725586,
                    },
                });
        }
    });


    it.skip(`Mass Create Tenant`, async () => {
        for (let i = 0; i < 100; i++) {
            TenantName = 'Auto Test Tenant ' + i;
            TenantDomain = `auto-test-tenant-${i}.com`
            {
                const targetPage = page;
                const promises = [];
                const startWaitingForEvents = () => {
                    promises.push(targetPage.waitForNavigation());
                }
                startWaitingForEvents();
                await targetPage.goto('http://localhost:9001/home');
                await Promise.all(promises);
            }
            {
                const targetPage = page;
                await puppeteer.Locator.race([
                    targetPage.locator('div:nth-of-type(2) > app-tile-group > div > div:nth-of-type(1) div.tile-body-md'),
                    targetPage.locator('::-p-xpath(//*[@id=\\"app\\"]/app-home/app-launchpad/div[2]/div[2]/app-tile-group/div/div[1]/a/app-tile/div/div/div[2])'),
                    targetPage.locator(':scope >>> div:nth-of-type(2) > app-tile-group > div > div:nth-of-type(1) div.tile-body-md'),
                    targetPage.locator('::-p-text(Manage All Tenants)')
                ])
                    .setTimeout(timeout)
                    .click({
                        offset: {
                            x: 58.11111068725586,
                            y: 21.72222900390625,
                        },
                    });
            }
            {
                const targetPage = page;
                await puppeteer.Locator.race([
                    targetPage.locator('::-p-aria( Create Tenant)'),
                    targetPage.locator('app-page-view > div > div.card div > div > div > div > button'),
                    targetPage.locator('::-p-xpath(//*[@id=\\"app\\"]/app-tn01/app-page-view/div/div[1]/div/div/div/div/div/button)'),
                    targetPage.locator(':scope >>> app-page-view > div > div.card div > div > div > div > button'),
                    targetPage.locator('::-p-text(Create Tenant)')
                ])
                    .setTimeout(timeout)
                    .click({
                        offset: {
                            x: 55.388916015625,
                            y: 18.111114501953125,
                        },
                    });
            }
            {
                const targetPage = page;
                await puppeteer.Locator.race([
                    targetPage.locator('::-p-aria(Name[role=\\"textbox\\"])'),
                    targetPage.locator('#create\\.tenant\\.name'),
                    targetPage.locator('::-p-xpath(//*[@id=\\"create.tenant.name\\"])'),
                    targetPage.locator(':scope >>> #create\\.tenant\\.name')
                ])
                    .setTimeout(timeout)
                    .click({
                        offset: {
                            x: 117.77777099609375,
                            y: 34.22221374511719,
                        },
                    });
            }
            {
                const targetPage = page;
                await puppeteer.Locator.race([
                    targetPage.locator('::-p-aria(Name[role=\\"textbox\\"])'),
                    targetPage.locator('#create\\.tenant\\.name'),
                    targetPage.locator('::-p-xpath(//*[@id=\\"create.tenant.name\\"])'),
                    targetPage.locator(':scope >>> #create\\.tenant\\.name')
                ])
                    .setTimeout(timeout)
                    .fill(TenantName);
            }
            {
                const targetPage = page;
                await puppeteer.Locator.race([
                    targetPage.locator('::-p-aria(Domain[role=\\"textbox\\"])'),
                    targetPage.locator('#create\\.tenant\\.domain'),
                    targetPage.locator('::-p-xpath(//*[@id=\\"create.tenant.domain\\"])'),
                    targetPage.locator(':scope >>> #create\\.tenant\\.domain')
                ])
                    .setTimeout(timeout)
                    .click({
                        offset: {
                            x: 34.77777099609375,
                            y: 21.444442749023438,
                        },
                    });
            }
            {
                const targetPage = page;
                await puppeteer.Locator.race([
                    targetPage.locator('::-p-aria(Domain[role=\\"textbox\\"])'),
                    targetPage.locator('#create\\.tenant\\.domain'),
                    targetPage.locator('::-p-xpath(//*[@id=\\"create.tenant.domain\\"])'),
                    targetPage.locator(':scope >>> #create\\.tenant\\.domain')
                ])
                    .setTimeout(timeout)
                    .fill(TenantDomain);
            }
            {
                const targetPage = page;
                await puppeteer.Locator.race([
                    targetPage.locator('div.modal-body'),
                    targetPage.locator('::-p-xpath(/html/body/ngb-modal-window/div/div/app-create-tenant/div[2])'),
                    targetPage.locator(':scope >>> div.modal-body')
                ])
                    .setTimeout(timeout)
                    .click({
                        offset: {
                            x: 36.77777099609375,
                            y: 232.22222137451172,
                        },
                    });
            }
            {
                const targetPage = page;
                await puppeteer.Locator.race([
                    targetPage.locator('::-p-aria(Create)'),
                    targetPage.locator('div.modal-body button'),
                    targetPage.locator('::-p-xpath(/html/body/ngb-modal-window/div/div/app-create-tenant/div[2]/form/button)'),
                    targetPage.locator(':scope >>> div.modal-body button')
                ])
                    .setTimeout(timeout)
                    .click({
                        offset: {
                            x: 33.77777099609375,
                            y: 28.666656494140625,
                        },
                    });
            }


        }
    }, timeout);
});
