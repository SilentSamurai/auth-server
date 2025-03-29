import { TestAppFixture } from "../test-app.fixture";
import { TokenFixture } from "../token.fixture";
import { HelperFixture } from "../helper.fixture";

describe("E2E Tenant Management", () => {
    let app: TestAppFixture;
    let tenant = { id: "", clientId: "", name: "", domain: "" };
    let refreshToken = "", accessToken = "";
    let helper: HelperFixture;

    beforeAll(async () => {
        app = await new TestAppFixture().init();
        const tokenFixture = new TokenFixture(app);
        const response = await tokenFixture.fetchAccessToken(
            "admin@auth.server.com",
            "admin9000",
            "auth.server.com"
        );
        refreshToken = response.refreshToken;
        accessToken = response.accessToken;
        helper = new HelperFixture(app, accessToken);
    });

    afterAll(async () => {
        await app.close();
    });

    // Helper to check for valid UUID
    let expectUuid = function (item: string) {
        expect(item).toMatch(
            /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
        );
    };

    it("should execute all tenant operations sequentially", async () => {
        // 1) Create Tenant
        tenant = await helper.tenant.createTenant("tenant-1", "test-website.com");
        expect(tenant.id).toBeDefined();

        // 2) Get Tenant Details
        let tenantDetails = await helper.tenant.getTenantDetails(tenant.id);
        console.log("Get Tenant Details Response:", tenantDetails);
        expect(tenantDetails.id).toEqual(tenant.id);
        expect(tenantDetails.name).toEqual("tenant-1");
        expect(tenantDetails.domain).toEqual("test-website.com");
        expect(tenantDetails.clientId).toBeDefined();

        // Verify members array
        expect(Array.isArray(tenantDetails.members)).toBe(true);
        expect(tenantDetails.members.length).toBeGreaterThanOrEqual(1);
        expectUuid(tenantDetails.members[0].id);
        expect(tenantDetails.members[0].email).toEqual("admin@auth.server.com");
        expect(tenantDetails.members[0].name).toEqual("Super Admin");

        // Verify roles array
        expect(Array.isArray(tenantDetails.roles)).toBe(true);
        expect(tenantDetails.roles.length).toBeGreaterThanOrEqual(2);
        expectUuid(tenantDetails.roles[0].id);
        expect(tenantDetails.roles[0].name).toEqual("TENANT_ADMIN");
        expectUuid(tenantDetails.roles[1].id);
        expect(tenantDetails.roles[1].name).toEqual("TENANT_VIEWER");

        // 3) Get Tenant Credentials
        let tenantCred = await helper.tenant.getTenantCredentials(tenant.id);
        console.log("Get Tenant Credentials Response:", tenantCred);
        // minimal check
        expect(tenantCred.id).toEqual(tenant.id);
        expect(tenantCred.clientId).toBeDefined();
        expect(tenantCred.publicKey).toBeDefined();

        // 4) Get Tenant Roles
        let roles = await helper.tenant.getTenantRoles(tenant.id);
        console.log("Get Tenant Roles Response:", roles);
        expect(Array.isArray(roles)).toBe(true);
        expect(roles.length).toBeGreaterThanOrEqual(2);

        // 5) Update Tenant
        let updatedTenant = await helper.tenant.updateTenant(tenant.id, "updated-tenant-1");
        console.log("Update Tenant Response:", updatedTenant);
        expect(updatedTenant.id).toEqual(tenant.id);
        expect(updatedTenant.name).toEqual("updated-tenant-1");
        expect(updatedTenant.domain).toEqual("test-website.com");

        // 6) Get Updated Tenant Details
        let updatedTenantDetails = await helper.tenant.getTenantDetails(tenant.id);
        console.log("Get Updated Tenant Details Response:", updatedTenantDetails);
        expect(updatedTenantDetails.name).toEqual("updated-tenant-1");
        expect(updatedTenantDetails.domain).toEqual("test-website.com");

        // 7) Create Role
        let newRole = await helper.tenant.createRole(tenant.id, "auditor");
        console.log("Create Role Response:", newRole);
        // minimal check
        expect(newRole.name).toEqual("auditor");

        // 8) Get Roles After Adding New Role
        let rolesAfterAdd = await helper.tenant.getTenantRoles(tenant.id);
        console.log("Get Roles After Adding Role Response:", rolesAfterAdd);
        expect(Array.isArray(rolesAfterAdd)).toBe(true);
        expect(rolesAfterAdd.find((r) => r.name === "auditor")).toBeDefined();

        // 9) Add Members
        let addMembersResponse = await helper.tenant.addMembers(tenant.id, ["legolas@mail.com"]);
        console.log("Add Members Response:", addMembersResponse);
        expect(addMembersResponse.id).toBeDefined();
        expect(addMembersResponse.name).toEqual("updated-tenant-1");
        expect(addMembersResponse.domain).toEqual("test-website.com");
        expect(Array.isArray(addMembersResponse.members)).toBe(true);
        expect(addMembersResponse.members.length).toBeGreaterThanOrEqual(2);
        expect(
            addMembersResponse.members.map((m: { email: string }) => m.email)
        ).toContain("legolas@mail.com");
        expect(Array.isArray(addMembersResponse.roles)).toBe(true);
        expect(addMembersResponse.roles.length).toBeGreaterThanOrEqual(3);
        expect(addMembersResponse.roles[0].name).toEqual("TENANT_ADMIN");
        expect(addMembersResponse.roles[1].name).toEqual("TENANT_VIEWER");
        expect(addMembersResponse.roles[2].name).toEqual("auditor");

        // capture newly-added user ID
        let legolasId = addMembersResponse.members.filter(
            (i: { email: string }) => i.email === "legolas@mail.com"
        )[0].id;

        // 10) Get Tenant Members
        let membersList = await helper.tenant.getTenantMembers(tenant.id);
        console.log("Get Tenant Members Response:", membersList);
        expect(Array.isArray(membersList)).toBe(true);
        expect(membersList.length).toBeGreaterThanOrEqual(2);

        // 11) Update Member Role
        let updateMemberRoleResp = await helper.tenant.updateMemberRoles(tenant.id, legolasId, [
            "TENANT_VIEWER",
            "auditor",
        ]);
        console.log("Update Member Role Response:", updateMemberRoleResp);
        // minimal check

        // 12) Verify Member Role Update
        let verifyMemberUpdate = await helper.tenant.getTenantMembers(tenant.id);
        console.log("Verify Member Role Update Response:", verifyMemberUpdate);
        expect(verifyMemberUpdate).toBeInstanceOf(Array);
        expect(verifyMemberUpdate.length).toBeGreaterThanOrEqual(1);
        expect(verifyMemberUpdate.map(i => i.id )).toContain(legolasId);

        // 13) Remove Members
        let removeMemberResp = await helper.tenant.removeMembers(tenant.id, ["legolas@mail.com"]);
        console.log("Remove Members Response:", removeMemberResp);
        // minimal check
        expect(removeMemberResp.id).toEqual(tenant.id);

        // 14) Verify Member Removal
        let verifyRemoval = await helper.tenant.getTenantMembers(tenant.id);
        console.log("Verify Member Removal Response:", verifyRemoval);
        expect(
            verifyRemoval.find((mem) => mem.email === "legolas@mail.com")
        ).toBeUndefined();

        // 15) Remove Role
        let removeRoleResp = await helper.tenant.deleteRole(tenant.id, "auditor");
        console.log("Remove Role Response:", removeRoleResp);
        // minimal check
        expect(removeRoleResp.name).toEqual("auditor");

        // 16) Verify Role Removal
        let verifyRoleRemoval = await helper.tenant.getTenantRoles(tenant.id);
        console.log("Verify Role Removal Response:", verifyRoleRemoval);
        expect(verifyRoleRemoval.find((r) => r.name === "auditor")).toBeUndefined();

        // 17) Remove Tenant
        let removeTenantResp = await helper.tenant.deleteTenant(tenant.id);

        expect(removeTenantResp.name).toEqual('updated-tenant-1');

        // 18) Verify Tenant Removal (should yield 404)
        try {
            await helper.tenant.getTenantDetails(tenant.id);
            fail("Expected 404 error, but got a 2xx response");
        } catch (error: any) {
            console.log("Verify Tenant Removal Response (error):", error);
            expect(error.status).toBe(404);
        }

        // 19) Get All Tenants
        let allTenants = await helper.tenant.getTenants();
        console.log("Get All Tenants Response:", allTenants);
        expect(Array.isArray(allTenants)).toBe(true);
    });
});