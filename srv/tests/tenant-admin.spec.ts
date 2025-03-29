import {TestAppFixture} from "./test-app.fixture";
import {TokenFixture} from "./token.fixture";
import {TenantClient} from "./api-client/tenant-client";

describe('e2e tenant admin', () => {
    let app: TestAppFixture;
    let tenant = {
        id: "",
        clientId: ""
    };
    let superAdminToken = "";
    let tenantAdminAccessToken = "";

    beforeAll(async () => {
        app = await new TestAppFixture().init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('should handle all tenant admin steps in one test', async () => {
        // STEP 1: Fetch Access Token (Super Admin)
        const tokenFixture = new TokenFixture(app);
        let response = await tokenFixture.fetchAccessToken(
            "admin@auth.server.com",
            "admin9000",
            "auth.server.com"
        );
        superAdminToken = response.accessToken;
        expect(superAdminToken).toBeDefined();

        // Create a TenantClient using the super admin token
        const superAdminClient = new TenantClient(app, superAdminToken);

        // STEP 2: Create Tenant
        let createdTenant = await superAdminClient.createTenant("tenant-1", "test-wesite.com");
        expect(createdTenant.id).toBeDefined();
        expect(createdTenant.name).toEqual("tenant-1");
        expect(createdTenant.domain).toEqual("test-wesite.com");
        expect(createdTenant.clientId).toBeDefined();

        // Store it in our tenant variable
        tenant = createdTenant;

        // STEP 3: Add Members
        let email = "legolas@mail.com";
        let addMemberResponse = await superAdminClient.addMembers(tenant.id, [email]);
        // The addMembers method internally expects a 201 and returns the updated tenant object
        expect(addMemberResponse.id).toEqual(tenant.id);
        const legolasId = addMemberResponse.members.filter(i => i.email === email)[0].id;

        // STEP 4: Update Member Role
        let updateRolesResp = await superAdminClient.updateMemberRoles(
            tenant.id,
            legolasId,
            ["TENANT_ADMIN"]
        );
        expect(updateRolesResp).toBeDefined(); // method handles status checks internally

        // STEP 5: Fetch User Access Token (Tenant Admin / Legolas)
        // We still use the raw token fixture for user token, as TenantClient does not handle token creation.
        response = await tokenFixture.fetchAccessToken(
            "legolas@mail.com",
            "legolas9000",
            "test-wesite.com"
        );
        tenantAdminAccessToken = response.accessToken;
        expect(tenantAdminAccessToken).toBeDefined();

        // Create a TenantClient using the tenant admin token
        const adminClient = new TenantClient(app, tenantAdminAccessToken);

        // STEP 6: Get Tenant Details
        const detailsResponse = await adminClient.getTenantDetails(tenant.id);
        expect(detailsResponse.id).toBeDefined();
        expect(detailsResponse.name).toEqual("tenant-1");
        expect(detailsResponse.domain).toEqual("test-wesite.com");
        expect(detailsResponse.clientId).toBeDefined();

        // STEP 7: Get Tenant Credentials
        let credentials = await adminClient.getTenantCredentials(tenant.id);
        expect(credentials.id).toBeDefined();
        expect(credentials.clientId).toBeDefined();
        expect(credentials.clientSecret).toBeDefined();
        expect(credentials.publicKey).toBeDefined();

        // STEP 8: Get Tenant Roles
        let roles = await adminClient.getTenantRoles(tenant.id);
        expect(Array.isArray(roles)).toBe(true);
        expect(roles.length).toBeGreaterThanOrEqual(2);

        // STEP 9: Update Tenant
        let updatedTenant = await adminClient.updateTenant(
            tenant.id,
            "updated-tenant-1",
        );
        expect(updatedTenant.id).toBeDefined();
        expect(updatedTenant.clientId).toEqual(tenant.clientId);
        expect(updatedTenant.name).toEqual("updated-tenant-1");
        expect(updatedTenant.domain).toEqual("test-wesite.com");

        // STEP 10: Create Role
        const roleName = "auditor";
        let createRoleResponse = await adminClient.createRole(tenant.id, roleName);
        // method handles status checks, returns the role or its response body
        expect(createRoleResponse).toBeDefined();
        // Check that the response contains the expected properties
        expect(createRoleResponse).toHaveProperty('id');  // Ensure role has an id
        expect(createRoleResponse).toHaveProperty('name', roleName);  // Ensure role name matches the requested one
        expect(createRoleResponse).toHaveProperty('removable', true);  // Check if the role is removable

        // Check tenant properties within the response
        expect(createRoleResponse.tenant).toBeDefined();
        expect(createRoleResponse.tenant).toHaveProperty('id');
        expect(createRoleResponse.tenant).toHaveProperty('name');
        expect(createRoleResponse.tenant).toHaveProperty('domain');
        expect(createRoleResponse.tenant).toHaveProperty('clientId');

        // If there are roles and members, check that they exist as arrays
        expect(Array.isArray(createRoleResponse.tenant.roles)).toBe(true);
        expect(createRoleResponse.tenant.roles.length).toBeGreaterThan(0);

        expect(Array.isArray(createRoleResponse.tenant.members)).toBe(true);
        expect(createRoleResponse.tenant.members.length).toBeGreaterThan(0);

        // Optionally, validate the structure of roles and members if necessary
        createRoleResponse.tenant.roles.forEach(role => {
            expect(role).toHaveProperty('name');
            expect(role).toHaveProperty('id');
        });

        createRoleResponse.tenant.members.forEach(member => {
            expect(member).toHaveProperty('email');
        });

        // STEP 11: Get Tenant Members
        let members = await adminClient.getTenantMembers(tenant.id);
        expect(Array.isArray(members)).toBe(true);
        expect(members.length).toBeGreaterThanOrEqual(2);
        expect(members[0].id).toBeDefined();
        expect(members[0].name).toBeDefined();

        // STEP 12: Remove Members (Forbidden for Tenant Admin)
        try {
            // The removeMembers method expects an array of emails and checks status === 200
            await adminClient.removeMembers(tenant.id, ["legolas@mail.com"]);
        } catch (e) {
            expect(e.status).toBe(403);
        }

        // STEP 13: Remove Role (Should be allowed for Tenant Admin)
        let deleteRoleResponse = await adminClient.deleteRole(tenant.id, roleName);
        // method expects a success status
        expect(deleteRoleResponse).toBeDefined();

        // STEP 14: Remove Tenant (Forbidden for Tenant Admin)
        try {
            await adminClient.deleteTenant(tenant.id);
        } catch (e) {
            expect(e.status).toBe(403);
        }

        // STEP 15: Get All Tenants (Forbidden for Tenant Admin)
        try {
            await adminClient.getTenants();
        } catch (e) {
            expect(e.status).toBe(403);
        }
    });
})