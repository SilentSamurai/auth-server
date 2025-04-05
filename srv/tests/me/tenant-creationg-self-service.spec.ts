import {v4 as uuidv4} from 'uuid';
import {TestAppFixture} from "../test-app.fixture";
import {UsersClient} from "../api-client/user-client";
import {TokenFixture} from "../token.fixture";
import {createFakeSmtpServer, EmailSearchCriteria, FakeSmtpServer} from "../../src/mail/FakeSmtpServer";
import {TenantClient} from "../api-client/tenant-client";
import {SearchClient} from "../api-client/search-client";


describe('UsersController (e2e)', () => {
    let app: TestAppFixture;
    let usersClient: UsersClient;
    let tenantClient: TenantClient;
    let searchClient: SearchClient;
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
    // const clientId = "shire.local";
    const tenantName = "TestTenant";
    const tenantDomain = "tt.com"

    beforeAll(async () => {
        // Create and set up the test application
        app = await new TestAppFixture().init();

        // Get admin access token for authenticated requests
        tokenFixture = new TokenFixture(app);

        // Initialize the users client with the access token
        usersClient = new UsersClient(app, "");
    });

    afterAll(async () => {
        await app.close();
    });


    describe('Tenant Creation & User Registration & Authentication Flow ', () => {
        it('should register a new user', async () => {
            // Test signup endpoint
            const signupResponse = await usersClient.registerTenant(testUserName, testUserEmail, testUserPassword, tenantName, tenantDomain);

            expect(signupResponse).toBeDefined();
            expect(signupResponse.success).toBeDefined();
            expect(signupResponse.success).toBe(true);

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

        it('should not login from any other tenant', async () => {
            // Test login to get access token
            try {
                const authResponse = await tokenFixture.fetchAccessToken(
                    testUserEmail,
                    testUserPassword,
                    "auth.server.com"
                );
            } catch (e) {
                expect(e.status).toBeDefined();
                expect(e.status).toBe(400);
            }
        });

        it('should authenticate the user', async () => {
            // Test login to get access token
            const authResponse = await tokenFixture.fetchAccessToken(
                testUserEmail,
                testUserPassword,
                tenantDomain
            );

            expect(authResponse).toBeDefined();
            expect(authResponse.accessToken).toBeDefined();

            // Initialize usersClient with the access token
            usersClient = new UsersClient(app, authResponse.accessToken);
            tenantClient = new TenantClient(app, authResponse.accessToken);
            searchClient = new SearchClient(app, authResponse.accessToken);
        });

        it('should get current user profile', async () => {
            // Test getMe endpoint
            const user = await usersClient.getMe();

            expect(user).toBeDefined();
            expect(user.email).toBe(testUserEmail);
            expect(user.name).toBe(testUserName);
        });

        it('check tenant is created', async () => {

            const tenant = await searchClient.findTenantBy({domain: tenantDomain});

            let tenantDetails = await tenantClient.getTenantDetails(tenant.id);
            console.log("Get Tenant Details Response:", tenantDetails);
            expect(tenantDetails.id).toEqual(tenant.id);
            expect(tenantDetails.name).toEqual(tenantName);
            expect(tenantDetails.domain).toEqual(tenantDomain);
            expect(tenantDetails.clientId).toBeDefined();

            // verify member
            expect(Array.isArray(tenantDetails.members)).toBe(true);
            expect(tenantDetails.members.length).toBeGreaterThanOrEqual(1);
            expect(tenantDetails.members[0].email).toEqual(testUserEmail);
            expect(tenantDetails.members[0].name).toEqual(testUserName);

        });
    });

    describe('Account Deletion', () => {
        it('should delete the user account', async () => {
            // Test signdown endpoint
            const response = await usersClient.signdown(testUserPassword);

            expect(response).toBeDefined();
            expect(response.status).toBe(true);

            // Try to login with deleted account - should fail
            try {
                await tokenFixture.fetchAccessToken(
                    updatedEmail,
                    testUserPassword,
                    tenantDomain
                );
                fail('Should not be able to login with deleted account');
            } catch (error) {
                expect(error).toBeDefined();
            }
        });

    });

});