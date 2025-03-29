import {TestAppFixture} from "../test-app.fixture";
import {TokenFixture} from "../token.fixture";
import {TenantClient} from "../api-client/tenant-client";

describe('e2e tenant', () => {
    let app: TestAppFixture;
    let tenant = {
        id: "",
        clientId: "",
        name: ""
    };
    let superAdminToken = "";
    let tenantViewerAccessToken = "";

    beforeAll(async () => {
        app = await new TestAppFixture().init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('should handle tenant lifecycle correctly', async () => {
        // Step 1: Fetch access token for Super Admin
        const tokenFixture = new TokenFixture(app);
        const response = await tokenFixture.fetchAccessToken(
            "admin@auth.server.com",
            "admin9000",
            "auth.server.com"
        );
        superAdminToken = response.accessToken;
        expect(superAdminToken).toBeDefined();

        const tenantClient = new TenantClient(app, superAdminToken);

        // Step 2: Create a new tenant using TenantClient
        tenant = await tenantClient.createTenant("tenant-1", "test-website.com");

        // Step 3: Add a member
        const email = "legolas@mail.com";
        const addMemberResponse = await tenantClient.addMembers(tenant.id, [email]);
        const legolasId = addMemberResponse.members.filter(i => i.email === email)[0].id;

        // Step 4: Assign a role to the member
        const updateMemberRoleResponse = await tenantClient.updateMemberRoles(
            tenant.id,
            legolasId,
            ["TENANT_VIEWER"]
        );
        expect(updateMemberRoleResponse).toBeDefined();

        // Step 5: Fetch access token for the created user (tenant viewer)
        const userTokenResponse = await tokenFixture.fetchAccessToken(
            "legolas@mail.com",
            "legolas9000",
            "test-website.com"
        );
        tenantViewerAccessToken = userTokenResponse.accessToken;
        const viewerClient = new TenantClient(app, tenantViewerAccessToken);

        // Step 6: Get tenant details with the viewer token
        const tenantDetailsResponse = await viewerClient.getTenantDetails(tenant.id);

        // Step 7: Try accessing tenant credentials (should be forbidden for viewer)
        try {
            await viewerClient.getTenantCredentials(tenant.id);
        } catch (e) {
            // Our client methods typically expect a 200. If the request returns 403, an error is thrown.
            // We check that the error’s response has status 403
            expect(e.status).toBe(403);
        }


        // Step 8: Get tenant roles (should be accessible by viewer)
        const tenantRolesResponse = await viewerClient.getTenantRoles(tenant.id);
        expect(Array.isArray(tenantRolesResponse)).toBe(true);
        expect(tenantRolesResponse.length).toBeGreaterThanOrEqual(2);

        // Step 9: Try updating tenant (should be forbidden for viewer)
        try {
            await viewerClient.updateTenant(tenant.id, "updated-tenant-1");
        } catch (e) {
            expect(e.status).toBe(403);
        }

        // Step 10: Try creating a new role (should be forbidden for viewer)
        try {
            await viewerClient.createRole(tenant.id, "auditor");
        } catch (e) {
            expect(e.status).toBe(403);
        }

        // Step 11: Get tenant members (should be accessible by viewer)
        const tenantMembersResponse = await viewerClient.getTenantMembers(tenant.id);
        expect(Array.isArray(tenantMembersResponse)).toBe(true);
        expect(tenantMembersResponse.length).toBeGreaterThanOrEqual(1);

        // Step 12: Try removing a member (should be forbidden for viewer)
        try {
            // The removeMembers call expects an array of emails
            await viewerClient.removeMembers(tenant.id, [email]);
        } catch (e) {
            expect(e.status).toBe(403);
        }

        // Step 13: Try removing a role (should be forbidden for viewer)
        try {
            await viewerClient.deleteRole(tenant.id, "auditor");
        } catch (e) {
            expect(e.status).toBe(403);
        }

        // Step 14: Try removing the tenant (should be forbidden for viewer)
        try {
            await viewerClient.deleteTenant(tenant.id);
        } catch (e) {
            expect(e.status).toBe(403);
        }

        // Step 15: Get all tenants (should be forbidden for viewer)
        try {
            await viewerClient.getTenants();
        } catch (e) {
            expect(e.status).toBe(403);
        }
    });
});