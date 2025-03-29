import {v4 as uuidv4} from 'uuid';
import {TestAppFixture} from "../test-app.fixture";
import {UsersClient} from "../api-client/user-client";
import {TokenFixture} from "../token.fixture";
import {createFakeSmtpServer, EmailSearchCriteria, FakeSmtpServer} from "../../src/mail/FakeSmtpServer";


describe('UsersController (e2e)', () => {
    let app: TestAppFixture;
    let usersClient: UsersClient;
    let tokenFixture: TokenFixture;
    let accessToken: string;
    let smtpServer: FakeSmtpServer;

    // Test user credentials
    const testUserEmail = `test-user-${uuidv4()}@example.com`;
    const testUserPassword = 'Test@123456';
    const testUserName = 'Test User';

    // Updated credentials for testing updates
    const updatedName = 'U Test User';
    const updatedEmail = `updated-${uuidv4()}@example.com`;
    const updatedPassword = 'UpdatedTest@123456';

    beforeAll(async () => {
        // Create and set up the test application
        app = await new TestAppFixture().init();
        await app.init();

        smtpServer = createFakeSmtpServer();
        smtpServer.listen();

        // Get admin access token for authenticated requests
        tokenFixture = new TokenFixture(app);
        const tokenResponse = await tokenFixture.fetchAccessToken(
            "admin@auth.server.com",
            "admin9000",
            "auth.server.com"
        );
        accessToken = tokenResponse.accessToken;

        // Initialize the users client with the access token
        usersClient = new UsersClient(app, accessToken);
    });

    afterAll(async () => {
        await app.close();
        smtpServer.close();
    });

    describe('User Registration and Authentication Flow', () => {
        it('should register a new user', async () => {
            // Test signup endpoint
            const signupResponse = await usersClient.signup(testUserName, testUserEmail, testUserPassword);

            expect(signupResponse).toBeDefined();
            expect(signupResponse.email).toBe(testUserEmail);
            expect(signupResponse.name).toBe(testUserName);
            expect(signupResponse.id).toBeDefined();
            // Password should not be returned
            expect(signupResponse.password).toBeUndefined();
        });

        it('should verify a new user via email link', async () => {
            // Find the verification email sent to our test user
            const search: EmailSearchCriteria = {
                to: testUserEmail,
                subject: /signing.*up.*Auth.*Server/i,
            }
            const verificationEmail = await smtpServer.waitForEmail(search);
            // Verify we found the email
            expect(verificationEmail).toBeDefined();

            // Extract the verification URL from the email body
            let urlMatch = smtpServer.extractPaths(verificationEmail);
            expect(urlMatch).toBeDefined();
            expect(urlMatch.length).toBeGreaterThan(1);

            const verificationPath = urlMatch[1];
            console.log('Verification path:', verificationPath);

            // Call the verification endpoint
            const response = await app.getHttpServer().get(verificationPath);

            // Verify the response
            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            expect(response.body.status).toBe(true);

            console.log('User verified successfully');
        });

        it('should authenticate the user', async () => {
            // Test login to get access token
            const authResponse = await tokenFixture.fetchAccessToken(
                testUserEmail,
                testUserPassword,
                "auth.server.com"
            );

            expect(authResponse).toBeDefined();
            expect(authResponse.accessToken).toBeDefined();

            // Initialize usersClient with the access token
            usersClient = new UsersClient(app, authResponse.accessToken);
        });

        it('should get current user profile', async () => {
            // Test getMe endpoint
            const user = await usersClient.getMe();

            expect(user).toBeDefined();
            expect(user.email).toBe(testUserEmail);
            expect(user.name).toBe(testUserName);
        });
    });

    describe('User Profile Management', () => {
        it('should update user name', async () => {
            // Test updateMyName endpoint
            const updatedUser = await usersClient.updateMyName(updatedName);

            expect(updatedUser).toBeDefined();
            expect(updatedUser.name).toBe(updatedName);
        });

        it('should update user email', async () => {
            // Test updateMyEmail endpoint
            const response = await usersClient.updateMyEmail(updatedEmail);

            expect(response).toBeDefined();
            expect(response.status).toEqual(true);
        });

        it('verify new email for change', async () => {
            const search: EmailSearchCriteria = {
                to: updatedEmail,
                subject: /.*Change.*email.*Auth.*Server.*/i,
            }
            const verificationEmail = await smtpServer.waitForEmail(search);
            // Verify we found the email
            expect(verificationEmail).toBeDefined();

            // Extract the verification URL from the email body
            let urlMatch = smtpServer.extractPaths(verificationEmail);
            expect(urlMatch).toBeDefined();
            expect(urlMatch.length).toBeGreaterThan(1);

            const verificationPath = urlMatch[1];
            console.log('Verification path:', verificationPath);

            // Call the verification endpoint
            const response = await app.getHttpServer().get(verificationPath);

            // Verify the response
            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
            expect(response.body.status).toBe(true);

            console.log('User verified successfully');
        });

        it('should get login with new email', async () => {
            const authResponse = await tokenFixture.fetchAccessToken(
                updatedEmail,
                testUserPassword,
                "auth.server.com"
            );

            expect(authResponse).toBeDefined();
            expect(authResponse.accessToken).toBeDefined();

            // Initialize usersClient with the access token
            usersClient = new UsersClient(app, authResponse.accessToken);
        });

        it('should update user password', async () => {
            // Test updateMyPassword endpoint
            const response = await usersClient.updateMyPassword(testUserPassword, updatedPassword);

            expect(response).toBeDefined();
            expect(response.status).toBe(true);

            // Re-authenticate with new password to verify it was changed
            const authResponse = await tokenFixture.fetchAccessToken(
                updatedEmail, // Use the updated email
                updatedPassword,
                "auth.server.com"
            );

            expect(authResponse.accessToken).toBeDefined();

            // Update the client with the new token
            usersClient = new UsersClient(app, authResponse.accessToken);
        });

        it('should get user tenants', async () => {
            // Test getMyTenants endpoint
            try {
                const tenants = await usersClient.getMyTenants();
            } catch (e) {
                expect(e.status).toEqual(403);
                expect(e.body.message).toBe('Forbidden');
            }
        });
    });

    describe('User Search', () => {
        it('should find user by email', async () => {
            // Test getUserByEmail method
            const user = await usersClient.getUserByEmail(updatedEmail); // Use updated email

            expect(user).toBeDefined();
            expect(user.email).toBe(updatedEmail);
        });
    });

    describe('Account Deletion', () => {
        it('should delete the user account', async () => {
            // Test signdown endpoint
            const response = await usersClient.signdown(updatedPassword);

            expect(response).toBeDefined();
            expect(response.status).toBe(true);

            // Try to login with deleted account - should fail
            try {
                await tokenFixture.fetchAccessToken(
                    updatedEmail,
                    updatedPassword,
                    "auth.server.com"
                );
                fail('Should not be able to login with deleted account');
            } catch (error) {
                expect(error).toBeDefined();
            }
        });
    });

});