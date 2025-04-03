import {TestAppFixture} from "../test-app.fixture";
import {TokenFixture} from "../token.fixture";
import {HelperFixture} from "../helper.fixture";

describe('e2e Groups Check', () => {
    let app: TestAppFixture;
    let helper: HelperFixture;

    let refreshToken = "";
    let accessToken = "";
    let tenant;
    let group;
    let role;

    beforeAll(async () => {
        app = await new TestAppFixture().init();
        let tokenFixture = new TokenFixture(app);
        let response = await tokenFixture.fetchAccessToken(
            "admin@auth.server.com",
            "admin9000",
            "auth.server.com"
        );
        refreshToken = response.refreshToken;
        accessToken = response.accessToken;
        helper = new HelperFixture(app, accessToken);
        tenant = await helper.tenant.createTenant("tenant-1", "test-web.com");
        role = await helper.role.createRole("ABC_ROLE", tenant.id);
        role = await helper.role.createRole("DEF_ROLE", tenant.id);
        await helper.tenant.addMembers(tenant.id, ["legolas@mail.com", "frodo@mail.com"]);
    });

    afterAll(async () => {
        await app.close();
    });

    it(`/Create Group for tenant`, async () => {
        group = await helper.group.createGroup("group-1", tenant.id);
    });

    it(`/Get All Groups for tenant`, async () => {
        let groups = await helper.group.getAllTenantGroups(tenant.id);
        expect(groups).toHaveLength(1);
        expect(groups[0].name).toEqual("group-1");
        expect(groups[0].tenantId).toEqual(tenant.id);
    });

    it(`/Get only current tenant groups`, async () => {
        let newTenant = await helper.tenant.createTenant("tenant-2", "dummy.tenant.com")
        let newGroup = await helper.group.createGroup("group-2", newTenant.id);

        let groups = await helper.group.getAllTenantGroups(tenant.id);
        expect(groups).toHaveLength(1);
        expect(groups[0].name).toEqual("group-1");
        expect(groups[0].tenantId).toEqual(tenant.id);
    });

    it(`Add Roles to Group`, async () => {
        let response = await helper.group.addRole(group.id, ["ABC_ROLE", "DEF_ROLE"]);

        expect(response.group.name).toEqual("group-1");
        expect(response.group.tenantId).toEqual(tenant.id);
        expect(response.roles).toBeDefined();
        expect(response.roles).toHaveLength(2);
        for (let role of response.roles) {
            expect(role.name).toMatch(/ABC_ROLE|DEF_ROLE/);
        }
    });

    it(`Add User to Group`, async () => {
        let user = await helper.user.getUserByEmail("legolas@mail.com");

        await helper.group.addUser(group.id, [user.email])
        let roles = await helper.tenant.getMemberRoles(tenant.id, user.id);
        for (let role of roles) {
            expect(role.name).toMatch(/ABC_ROLE|DEF_ROLE/);
        }
    });

    it(`Remove User from Group`, async () => {
        let user = await helper.user.getUserByEmail("legolas@mail.com");

        await helper.group.removeUser(group.id, ["legolas@mail.com"]);
        let roles = await helper.tenant.getMemberRoles(tenant.id, user.id);
        for (let role of roles) {
            expect(role.name).not.toMatch(/ABC_ROLE|DEF_ROLE/);
        }
    });

    it(`Add User to Group`, async () => {
        let user = await helper.user.getUserByEmail("frodo@mail.com");

        await helper.group.addUser(group.id, ["frodo@mail.com"])
        let roles = await helper.tenant.getMemberRoles( tenant.id, user.id);
        for (let role of roles) {
            expect(role.name).toMatch(/ABC_ROLE|DEF_ROLE/);
        }
    });

    it(`Remove Roles from Group`, async () => {
        let response = await helper.group.removeRoles(group.id, ["ABC_ROLE"]);
        expect(response.group.name).toEqual("group-1");
        expect(response.group.tenantId).toEqual(tenant.id);
        expect(response.roles).toBeDefined();
        expect(response.roles).toHaveLength(1);
        for (let role of response.roles) {
            expect(role.name).toMatch(/DEF_ROLE/);
        }
        let user = await helper.user.getUserByEmail("frodo@mail.com");

        let roles = await helper.tenant.getMemberRoles(tenant.id, user.id );

        for (let role of roles) {
            expect(role.name).toMatch(/DEF_ROLE/);
        }

    });

    it(`/Get Group`, async () => {
        let response = await helper.group.getGroup(group.id);

        expect(response.group.name).toEqual("group-1");
        expect(response.group.tenantId).toEqual(tenant.id);
    });

    it(`/Update Group Name`, async () => {
        const response = await app.getHttpServer()
            .patch(`/api/group/${group.id}/update`)
            .send({
                "name": "group-name-patch"
            })
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Accept', 'application/json');

        console.log("Response: ", response.body);

        expect(response.status).toEqual(200);
        expect(response.body.id).toBeDefined();
        expect(response.body.name).toEqual("group-name-patch");
        expect(response.body.tenantId).toEqual(tenant.id);
    });

    it(`/Delete Group Name`, async () => {
        const response = await app.getHttpServer()
            .delete(`/api/group/${group.id}/delete`)
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Accept', 'application/json');

        console.log("Response: ", response.body);

        expect(response.status).toEqual(200);
        expect(response.body.id).toBeDefined();
        expect(response.body.name).toEqual("group-name-patch");
        expect(response.body.tenantId).toEqual(tenant.id);
    });

});

