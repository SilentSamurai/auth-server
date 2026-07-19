import {v4 as uuidv4} from 'uuid';
import {SharedTestFixture} from '../shared-test.fixture';
import {UsersClient} from '../api-client/user-client';
import {TokenFixture} from '../token.fixture';

/**
 * Regression test: change-email confirmation tokens must not be forgeable.
 *
 * The token used to be signed with the account's own email address as the HMAC
 * secret. An email address is public, so anyone who knew a victim's address
 * could mint a valid token, repoint the account at an address they controlled,
 * and take it over via password reset. The signing key now binds the password
 * hash, which is not public.
 */
/**
 * Pick the path for a given endpoint out of an email's extracted paths.
 * The plain-text body wraps links in [brackets] and the closing bracket
 * survives into the extracted pathname, so strip it.
 */
function linkPath(paths: string[], endpoint: string): string {
    return paths
        .filter(path => path.includes(endpoint))
        .map(path => path.replace(/]$/, ''))[0];
}

describe('change-email token forgery', () => {
    let app: SharedTestFixture;
    let usersClient: UsersClient;
    let tokenFixture: TokenFixture;

    const userEmail = `change-email-${uuidv4()}@example.com`;
    const userPassword = 'Test@123456';
    const attackerEmail = `attacker-${uuidv4()}@evil.example.com`;
    const clientId = 'shire.local';

    beforeAll(async () => {
        app = new SharedTestFixture();
        tokenFixture = new TokenFixture(app);
        usersClient = new UsersClient(app, '');

        await usersClient.signup('Change Email User', userEmail, userPassword, clientId);

        const verificationEmail = await app.smtp.waitForEmail(
            {to: userEmail, subject: /signing.*up.*Auth.*Server/i},
            25000,
        );
        const verifyPath = linkPath(
            app.smtp.extractPaths(verificationEmail),
            '/api/oauth/verify-email/',
        );
        await app.getHttpServer().get(verifyPath);

        const auth = await tokenFixture.fetchAccessTokenFlow(userEmail, userPassword, clientId);
        usersClient = new UsersClient(app, auth.accessToken);
    });

    afterAll(async () => {
        await app.close();
    });

    it('rejects a token signed with the account email as the secret', async () => {
        const forged = await app.jwtService().signAsync(
            {sub: userEmail, updatedEmail: attackerEmail},
            {secret: userEmail, algorithm: 'HS256', expiresIn: '1h'},
        );

        const response = await app.getHttpServer().get(`/api/oauth/change-email/${forged}`);

        expect(response.status).toBe(401);

        // The account must still be reachable at its original address.
        const me = await usersClient.getMe();
        expect(me.email).toBe(userEmail);
    });

    it('still accepts a legitimately issued change-email link', async () => {
        const newEmail = `changed-${uuidv4()}@example.com`;

        await usersClient.updateMyEmail(newEmail);

        const changeEmail = await app.smtp.waitForEmail(
            {to: newEmail, subject: /Change.*your.*email/i},
            25000,
        );
        const changePath = linkPath(
            app.smtp.extractPaths(changeEmail),
            '/api/oauth/change-email/',
        );

        const response = await app.getHttpServer().get(changePath);
        expect(response.status).toBe(302);

        const me = await usersClient.getMe();
        expect(me.email).toBe(newEmail);
    });
});
