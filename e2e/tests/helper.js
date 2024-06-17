class LoginHelper {

    static async adminLogin(page) {
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
    }

    static async delay(timeout) {
        return await new Promise((resolve) => {
            setTimeout(resolve, timeout);
        });
    }

}

module.exports = {
    LoginHelper: LoginHelper
}
