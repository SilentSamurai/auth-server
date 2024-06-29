const puppeteer = require('puppeteer-core')
const helper = require('./helper');

// or import puppeteer from 'puppeteer-core';

describe('e2e Tenant Flow', () => {
    let page;
    let browser;
    let TENANT_NAME = 'Test Tenant';
    let TENANT_DOMAIN = "test-tenant.com"
    const TenantUpdateName = 'Test Updated Tenant';
    const timeout = 5000;

    beforeAll(async () => {
        browser = await helper.LoginHelper.getBrowser();

        page = await browser.newPage();
        await page.goto('http://localhost:9001/');
        await page.setViewport({width: 1080, height: 1024});

        await helper.LoginHelper.adminLogin(page);

    });

    beforeEach(async () => {
        page = await browser.newPage();
        await page.goto('http://localhost:9001/');
        await page.setViewport({width: 1024, height: 1024});
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
                .fill(TENANT_NAME);
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
                .fill(TENANT_DOMAIN);
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
                .fill(TENANT_DOMAIN);
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
        const ROLE_NAME = "DUMMY_ROLE_1";
        const ROLE_DESC = "DUMMY_ROLE_1";
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
                        x: 22.982635498046875,
                        y: 19.96179962158203,
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
                        x: 130.91665649414062,
                        y: 58.326385498046875,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria()'),
                targetPage.locator('#Tenant-vh-btn'),
                targetPage.locator('::-p-xpath(//*[@id=\\"Tenant-vh-btn\\"])'),
                targetPage.locator(':scope >>> #Tenant-vh-btn')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 25.12493896484375,
                        y: 5.3055419921875,
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
                        x: 79.23956298828125,
                        y: 7.7222137451171875,
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
                .fill(TENANT_DOMAIN);
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
                        x: 22.6527099609375,
                        y: 21.732635498046875,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator(`::-p-aria(${TENANT_DOMAIN})`),
                targetPage.locator('td:nth-of-type(3)'),
                targetPage.locator('::-p-xpath(//*[@id=\\"pr_id_3-table\\"]/tbody/tr/td[3])'),
                targetPage.locator(':scope >>> td:nth-of-type(3)')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 155.333251953125,
                        y: 18.048599243164062,
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
                        x: 30.31591796875,
                        y: 14.2291259765625,
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
                        x: 38.20831298828125,
                        y: 12.104156494140625,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(ROLES) >>>> ::-p-aria([role=\\"strong\\"])'),
                targetPage.locator('li:nth-of-type(2) strong'),
                targetPage.locator('::-p-xpath(//*[@id=\\"app\\"]/view-tenant/app-object-page/div/div[1]/div/div[3]/div/ul/li[2]/button/strong)'),
                targetPage.locator(':scope >>> li:nth-of-type(2) strong')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 27.111083984375,
                        y: 15.673583984375,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(Create Role)'),
                targetPage.locator('div.container > div:nth-of-type(2) div.p-datatable-header button'),
                targetPage.locator('::-p-xpath(//*[@id=\\"pr_id_5\\"]/div[1]/div/button)'),
                targetPage.locator(':scope >>> div.container > div:nth-of-type(2) div.p-datatable-header button'),
                targetPage.locator('::-p-text(Create Role)')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 55.833251953125,
                        y: 14.798583984375,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(Role Name)'),
                targetPage.locator('#add\\.role\\.name'),
                targetPage.locator('::-p-xpath(//*[@id=\\"add.role.name\\"])'),
                targetPage.locator(':scope >>> #add\\.role\\.name')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 71.23260498046875,
                        y: 9.8367919921875,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(Role Name)'),
                targetPage.locator('#add\\.role\\.name'),
                targetPage.locator('::-p-xpath(//*[@id=\\"add.role.name\\"])'),
                targetPage.locator(':scope >>> #add\\.role\\.name')
            ])
                .setTimeout(timeout)
                .fill(ROLE_NAME);
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
                        x: 34.23260498046875,
                        y: 21.670135498046875,
                    },
                });
        }
        {
            await page.mouse.click(10, 10);
            await page.mouse.click(10, 10);
            await helper.LoginHelper.delay(1000);
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('#BCK_TO_HOME_BTN'),
                targetPage.locator('[id="BCK_TO_HOME_BTN"]')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 158,
                        y: 13.145833015441895,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(Roles) >>>> ::-p-aria([role=\\"strong\\"])'),
                targetPage.locator('li:nth-of-type(5) strong'),
                targetPage.locator('::-p-xpath(//*[@id=\\"app\\"]/app-home/app-launchpad/div[1]/ul/li[5]/button/strong)'),
                targetPage.locator(':scope >>> li:nth-of-type(5) strong')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 21.611083984375,
                        y: 17.96179962158203,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('div:nth-of-type(5) div > div:nth-of-type(2) app-tile > div > div'),
                targetPage.locator('::-p-xpath(//*[@id=\\"app\\"]/app-home/app-launchpad/div[2]/div[5]/app-tile-group/div/div[2]/a/app-tile/div/div)'),
                targetPage.locator(':scope >>> div:nth-of-type(5) div > div:nth-of-type(2) app-tile > div > div'),
                targetPage.locator('::-p-text(RL02  Display)')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 81.90625,
                        y: 45.96527099609375,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria()'),
                targetPage.locator('#Role-vh-btn'),
                targetPage.locator('::-p-xpath(//*[@id=\\"Role-vh-btn\\"])'),
                targetPage.locator(':scope >>> #Role-vh-btn')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 10.12493896484375,
                        y: 9.083328247070312,
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
                        x: 97.23956298828125,
                        y: 15.722213745117188,
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
                .fill(TENANT_DOMAIN);
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('div.col-md-11 > div > div:nth-of-type(1) input'),
                targetPage.locator('::-p-xpath(/html/body/ngb-modal-window/div/div/app-value-help/div[1]/div[2]/div/app-fb/div/div[1]/div/div[1]/app-filter-field/div/div[2]/div/input)'),
                targetPage.locator(':scope >>> div.col-md-11 > div > div:nth-of-type(1) input')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 189.23260498046875,
                        y: 0.7222137451171875,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('div.col-md-11 > div > div:nth-of-type(1) input'),
                targetPage.locator('::-p-xpath(/html/body/ngb-modal-window/div/div/app-value-help/div[1]/div[2]/div/app-fb/div/div[1]/div/div[1]/app-filter-field/div/div[2]/div/input)'),
                targetPage.locator(':scope >>> div.col-md-11 > div > div:nth-of-type(1) input')
            ])
                .setTimeout(timeout)
                .fill(ROLE_NAME);
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
                        x: 18.6527099609375,
                        y: 6.732635498046875,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator(`::-p-aria(${TENANT_NAME})`),
                targetPage.locator('td:nth-of-type(4)'),
                targetPage.locator('::-p-xpath(//*[@id=\\"pr_id_6-table\\"]/tbody/tr/td[4])'),
                targetPage.locator(':scope >>> td:nth-of-type(4)'),
                targetPage.locator(`::-p-text(${TENANT_NAME}`)
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 98.048583984375,
                        y: 23.048599243164062,
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
                        x: 4.31591796875,
                        y: 15.2291259765625,
                    },
                });
        }
        {
            await helper.LoginHelper.delay(2000);
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(Continue)'),
                targetPage.locator('form > div > button'),
                targetPage.locator('::-p-xpath(//*[@id=\\"app\\"]/app-role-list/div/div/div/form/div/button)'),
                targetPage.locator(':scope >>> form > div > button'),
                targetPage.locator('::-p-text(Continue)')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 30.20831298828125,
                        y: 1.8819427490234375,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('app-object-page li'),
                targetPage.locator('::-p-xpath(//*[@id=\\"app\\"]/app-group-object/app-object-page/div/div[1]/div/div[3]/div/ul/li)'),
                targetPage.locator(':scope >>> app-object-page li')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 55.3367919921875,
                        y: 8.194427490234375,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(USERS) >>>> ::-p-aria([role=\\"strong\\"])'),
                targetPage.locator('strong'),
                targetPage.locator('::-p-xpath(//*[@id=\\"app\\"]/app-group-object/app-object-page/div/div[1]/div/div[3]/div/ul/li/button/strong)'),
                targetPage.locator(':scope >>> strong')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 37.225677490234375,
                        y: 9.097213745117188,
                    },
                });
        }
    });

    it(`Delete Role`, async () => {
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
                        x: 12.982635498046875,
                        y: 6.961799621582031,
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
                        x: 68.91665649414062,
                        y: 41.48957824707031,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria() >>>> ::-p-aria([role=\\"generic\\"])'),
                targetPage.locator('i'),
                targetPage.locator('::-p-xpath(//*[@id=\\"Tenant-vh-btn\\"]/i)'),
                targetPage.locator(':scope >>> i')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 5.413177490234375,
                        y: 1.1423492431640625,
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
                        x: 85.35067749023438,
                        y: 11.722213745117188,
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
                .fill(TENANT_DOMAIN);
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
                        x: 11.76385498046875,
                        y: 16.732635498046875,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator(`::-p-aria(${TENANT_DOMAIN})`),
                targetPage.locator('td:nth-of-type(3)'),
                targetPage.locator('::-p-xpath(//*[@id=\\"pr_id_11-table\\"]/tbody/tr/td[3])'),
                targetPage.locator(':scope >>> td:nth-of-type(3)')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 91.44439697265625,
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
                        x: 39.42706298828125,
                        y: 23.2291259765625,
                    },
                });
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
                        x: 22.604156494140625,
                        y: 15.486099243164062,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(ROLES) >>>> ::-p-aria([role=\\"strong\\"])'),
                targetPage.locator('li:nth-of-type(2) strong'),
                targetPage.locator('::-p-xpath(//*[@id=\\"app\\"]/view-tenant/app-object-page/div/div[1]/div/div[3]/div/ul/li[2]/button/strong)'),
                targetPage.locator(':scope >>> li:nth-of-type(2) strong')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 27.222213745117188,
                        y: 11.683990478515625,
                    },
                });
        }
        {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('div.container > div:nth-of-type(2) tr:nth-of-type(1) button'),
                targetPage.locator(':scope >>> div.container > div:nth-of-type(2) tr:nth-of-type(1) button')
            ])
                .setTimeout(timeout)
                .click({
                    offset: {
                        x: 24.96868896484375,
                        y: 9.861083984375,
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
                        x: 27.788177490234375,
                        y: 29.315963745117188,
                    },
                });
        }
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
                .fill(TENANT_DOMAIN);
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
                targetPage.locator(`::-p-aria(${TENANT_DOMAIN})`),
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
            TENANT_NAME = 'Auto Test Tenant ' + i;
            TENANT_DOMAIN = `auto-test-tenant-${i}.com`
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
                    .fill(TENANT_NAME);
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
                    .fill(TENANT_DOMAIN);
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
