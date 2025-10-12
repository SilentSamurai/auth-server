import { TestAppFixture } from "../test-app.fixture";
import * as argon2 from "argon2";

describe("e2e forgot/reset password flow", () => {
    let app: TestAppFixture;
    const email = "forgot.reset@test.com";
    const originalPassword = "OrigPassw0rd";
    const newPassword = "NewPassw0rd";
    const clientId = "shire.local";

    beforeAll(async () => {
        app = await new TestAppFixture().init();

        // Create user via public API using UsersClient, then set verified=true
        const { UsersClient } = await import("../api-client/user-client");
        const usersClient = new UsersClient(app, "");
        await usersClient.signup("Forgot Reset User", email, originalPassword, clientId);
        // Mark verified for reset-password eligibility
        const repo = app.nestApp.get("UserRepository");
        const created = await repo.findOne({ where: { email } });
        created.verified = true;
        await repo.save(created);
    });

    afterAll(async () => {
        await app.close();
    });

    it("should send reset password email and allow password reset", async () => {
        // 1) Trigger forgot password
        const resForgot = await app
            .getHttpServer()
            .post("/api/oauth/forgot-password")
            .set("Accept", "application/json")
            .set("Host", "localhost:9001")
            .send({ email });

        expect(resForgot.status).toBe(201);
        expect(resForgot.body.status).toBe(true);

        // 2) Wait for reset email
        const emailMsg = await app.smtp.waitForEmail({
            to: email,
            subject: /Reset your password/i,
            containsLink: true,
            sort: "newest",
            limit: 1,
        }, 10000, 500);

        const links = app.smtp.extractLinks(emailMsg);
        expect(links.length).toBeGreaterThan(0);

        // Find reset link and extract token directly from the full URL
        // Expect URL containing path: /reset-password/:token
        const resetLink = links.find((l) => /\/reset-password\//i.test(l));
        expect(resetLink).toBeDefined();
        // Clean trailing punctuation that may be included by mail rendering (e.g., "]", ")", ">")
        const cleanedResetLink = resetLink!.replace(/[\]\)>]+$/g, "");
        const tokenMatch = cleanedResetLink.match(/\/reset-password\/([^\/?#\]\)>]+)/i);
        expect(tokenMatch && tokenMatch[1]).toBeTruthy();
        const token = tokenMatch![1];

        // 3) Submit new password with token
        const resReset = await app
            .getHttpServer()
            .post(`/api/oauth/reset-password/${token}`)
            .set("Accept", "application/json")
            .send({ password: newPassword });

        expect(resReset.status).toBe(201);
        expect(resReset.body.status).toBe(true);

        // 4) Verify login works with new password via password grant
        const resLogin = await app
            .getHttpServer()
            .post("/api/oauth/token")
            .set("Accept", "application/json")
            .send({
                grant_type: "password",
                username: email,
                password: newPassword,
                client_id: clientId,
            });

        expect(resLogin.status).toBe(201);
        expect(resLogin.body.access_token).toBeDefined();
        expect(resLogin.body.refresh_token).toBeDefined();
    });
});
