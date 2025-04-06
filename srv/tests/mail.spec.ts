// test-send.js
import {createFakeSmtpServer, EmailSearchCriteria, FakeSmtpServer} from "../src/mail/FakeSmtpServer";

const nodemailer = require('nodemailer');

async function sendTestEmail() {
    const transporter = nodemailer.createTransport({
        host: 'localhost',
        port: 587,
        secure: false,
        tls: {
            rejectUnauthorized: false
        }
    });

    await transporter.sendMail({
        from: '"Tester" <tester@example.com>',
        to: 'recipient@example.com',
        subject: 'Hello from Node',
        text: 'This is a test email using nodemailer + fake SMTP server.'
    });

    console.log('✅ Test email sent');
}

let console = require('console');
global.console = console;

describe("Fake Smtp Server Test", () => {

    let smtpServer: FakeSmtpServer;

    beforeAll(async () => {
        smtpServer = createFakeSmtpServer();
        await smtpServer.listen();
    })

    afterAll(async () => {
        await smtpServer.close();
    })

    it('should work', async () => {
        await sendTestEmail();

        const search: EmailSearchCriteria = {
            to: "recipient@example.com",
            subject: /Hello.*/i,
        }
        const email = await smtpServer.waitForEmail(search);

        expect(email).toBeDefined();
        expect(email.to['text']).toBe("recipient@example.com");
        expect(email.from.text).toBe(`"Tester" <tester@example.com>`)
    });

})
