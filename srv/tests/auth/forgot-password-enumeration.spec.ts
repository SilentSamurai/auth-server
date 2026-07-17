// Inline NestJS test module so we can jest.spyOn the mail + user services and
// drive the mail path into failure without a real SMTP server.

import {INestApplication} from "@nestjs/common";
import {Test, TestingModule} from "@nestjs/testing";
import * as superTest from "supertest";
import * as process from "node:process";

import {AppModule} from "../../src/app.module";
import {MailService} from "../../src/mail/mail.service";
import {AuthUserService} from "../../src/casl/authUser.service";
import {Environment} from "../../src/config/environment.service";
import {setupConsole} from "../helper.fixture";

/**
 * Regression: POST /forgot-password must not reveal whether an account exists.
 *
 * The response body was already unified to {status:true}, but a registered
 * address still returned 503 when the mail service failed or the per-user mail
 * rate limit was hit, while an unknown address always returned 201. That status
 * difference is an enumeration oracle. Failures are now swallowed and logged, so
 * the status is uniform regardless of existence or delivery outcome.
 */
describe('forgot-password account enumeration', () => {
    let app: INestApplication;
    let moduleRef: TestingModule;
    let mailService: MailService;
    let authUserService: AuthUserService;

    setupConsole();

    const knownUser = {
        id: 'enum-guard-user',
        email: 'known-enum@test.com',
        name: 'Known Enum',
        password: 'not-a-real-hash-but-fine-as-hmac-secret',
    } as any;

    beforeAll(async () => {
        process.env.ENV = 'testing';
        process.env.ENABLE_FAKE_SMTP_SERVER = 'false';
        Environment.setup();

        moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleRef.createNestApplication();
        await app.init();

        mailService = app.get<MailService>(MailService);
        authUserService = app.get<AuthUserService>(AuthUserService);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    afterAll(async () => {
        await app.close();
        await moduleRef.close();
    });

    function forgot(email: string) {
        return superTest(app.getHttpServer())
            .post('/api/oauth/forgot-password')
            .set('Accept', 'application/json')
            .send({email});
    }

    it('returns 201 {status:true} for an unknown address and sends no mail', async () => {
        jest.spyOn(authUserService, 'findUserByEmail').mockRejectedValue(new Error('not found'));
        const sendSpy = jest.spyOn(mailService, 'sendResetPasswordMail');

        const res = await forgot('nobody-enum@test.com');

        expect(res.status).toBe(201);
        expect(res.body).toEqual({status: true});
        expect(sendSpy).not.toHaveBeenCalled();
    });

    it('returns 201 {status:true} for a known address even when mail delivery fails (e.g. rate limited)', async () => {
        jest.spyOn(authUserService, 'findUserByEmail').mockResolvedValue(knownUser);
        // Old code threw ServiceUnavailableException (503) here — an existence oracle.
        const sendSpy = jest.spyOn(mailService, 'sendResetPasswordMail').mockResolvedValue(false);

        const res = await forgot(knownUser.email);

        expect(res.status).toBe(201);
        expect(res.body).toEqual({status: true});
        expect(sendSpy).toHaveBeenCalledTimes(1);
    });

    it('returns 201 {status:true} for a known address even when the mail service throws', async () => {
        jest.spyOn(authUserService, 'findUserByEmail').mockResolvedValue(knownUser);
        jest.spyOn(mailService, 'sendResetPasswordMail').mockRejectedValue(new Error('smtp down'));

        const res = await forgot(knownUser.email);

        expect(res.status).toBe(201);
        expect(res.body).toEqual({status: true});
    });
});
