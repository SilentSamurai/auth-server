import {TestAppFixture} from "../test-app.fixture";
import {PolicyClient} from "../api-client/policy-client";
import {TokenFixture} from "../token.fixture";
import {TenantClient} from "../api-client/tenant-client";
import {SearchClient} from "../api-client/search-client";
import {Action, Effect} from "../../src/casl/actions.enum";

describe('Policy Flow (e2e)', () => {
    let app: TestAppFixture;

    beforeAll(async () => {
        app = await new TestAppFixture().init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('test policy flow', async () => {

        const tokenFixture = new TokenFixture(app);
        let tokenResponse = await tokenFixture.fetchAccessToken(
            "admin@shire.local",
            "admin9000",
            "shire.local"
        );
        let accessToken = tokenResponse.accessToken;
        let policyClient = new PolicyClient(app, accessToken);
        const tenantClient = new TenantClient(app, accessToken);
        const searchClient = new SearchClient(app, accessToken);

        const tenant = await searchClient.findTenantBy({domain: "shire.local"});
        const user = await searchClient.findByUser({email: "admin@shire.local"});

        let role = await tenantClient.createRole(tenant.id, "TEST_ROLE");

        const roles = await tenantClient.getMemberRoles(tenant.id, user.id);
        roles.push(role);

        await tenantClient.updateMemberRoles(tenant.id, user.id, roles.map(r => r.name));

        const newPolicy = await policyClient.createAuthorization(
            role.id,
            Effect.ALLOW,
            Action.Read,
            "secure-resource",
            {public: false}
        );

        const credential = await tenantClient.getTenantCredentials(tenant.id);

        const ccTr = await tokenFixture.fetchClientCredentialsToken(
            credential.clientId,
            credential.clientSecret
        );
        accessToken = ccTr.accessToken;

        policyClient = new PolicyClient(app, accessToken);

        // 6) Check if user permission now includes that policy
        const myPolicies = await policyClient.getTenantPermissions("admin@shire.local");
        expect(myPolicies).toBeDefined();
        expect(Array.isArray(myPolicies)).toBe(true);
        expect(myPolicies.length).toBeGreaterThan(0);

        // Confirm at least one of them matches the newly created policy
        const foundPolicy = myPolicies.find(auth => auth.subject === newPolicy.subject);
        expect(foundPolicy).toBeDefined();
        expect(foundPolicy.action).toBe(Action.Read);
        expect(foundPolicy.subject).toBe(newPolicy.subject);
        expect(foundPolicy.conditions).toBeDefined()
        expect(foundPolicy.conditions.public).toBeDefined()
        expect(foundPolicy.conditions.public).toBe(false);
    });

});
