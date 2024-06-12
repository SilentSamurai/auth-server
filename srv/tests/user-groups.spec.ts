import {TestAppFixture} from "./test-app.fixture";
import {TokenFixture} from "./token.fixture";
import {HelperFixture} from "./helper.fixture";
import {he} from "date-fns/locale";

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
        tenant = await helper.createTenant("tenant-1", "test-web.com");
        role = await helper.createRole("ABC_ROLE", tenant.id);
        role = await helper.createRole("DEF_ROLE", tenant.id);
        await helper.addMembers("legolas@mail.com", tenant.id);
        await helper.addMembers("frodo@mail.com", tenant.id);
    });

    afterAll(async () => {
        await app.close();
    });

    it(`/Create Group for tenant`, async () => {
        const response = await app.getHttpServer()
            .post('/api/group/create')
            .send({
                "name": "group-1",
                "tenantId": tenant.id
            })
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Accept', 'application/json');

        console.log("Response: ", response.body);

        expect(response.status).toEqual(201);
        expect(response.body.id).toBeDefined();
        expect(response.body.name).toEqual("group-1");
        expect(response.body.tenantId).toEqual(tenant.id);
        group = response.body;
    });

    it(`Add Roles to Group`, async () => {
        const response = await app.getHttpServer()
            .post(`/api/group/${group.id}/add-roles`)
            .send({
                "roles": ["ABC_ROLE", "DEF_ROLE"]
            })
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Accept', 'application/json');

        console.log("Response: ", response.body);

        expect(response.status).toEqual(201);
        expect(response.body.group).toBeDefined();
        expect(response.body.group.name).toEqual("group-1");
        expect(response.body.group.tenantId).toEqual(tenant.id);
        expect(response.body.roles).toBeDefined();
        expect(response.body.roles).toHaveLength(2);
        for (let role of response.body.roles) {
            expect(role.name).toMatch(/ABC_ROLE|DEF_ROLE/);
        }

    });

    it(`Add User to Group`, async () => {
        const response = await app.getHttpServer()
            .post(`/api/group/${group.id}/add-users`)
            .send({
                "users": ["legolas@mail.com"]
            })
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Accept', 'application/json');

        console.log("Response: ", response.body);

        expect(response.status).toEqual(201);
        expect(response.body.group).toBeDefined();
        expect(response.body.group.name).toEqual("group-1");
        expect(response.body.group.tenantId).toEqual(tenant.id);
        expect(response.body.users).toBeDefined();
        expect(response.body.users).toHaveLength(1);
        expect(response.body.users[0].email).toEqual("legolas@mail.com");

        let roles = await helper.getMemberRoles("legolas@mail.com", tenant.id);

        for (let role of roles) {
            expect(role.name).toMatch(/ABC_ROLE|DEF_ROLE/);
        }

    });

    it(`Remove User from Group`, async () => {
        const response = await app.getHttpServer()
            .post(`/api/group/${group.id}/remove-users`)
            .send({
                "users": ["legolas@mail.com"]
            })
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Accept', 'application/json');

        console.log("Response: ", response.body);

        expect(response.status).toEqual(201);
        expect(response.body.group).toBeDefined();
        expect(response.body.group.name).toEqual("group-1");
        expect(response.body.group.tenantId).toEqual(tenant.id);
        expect(response.body.users).toBeDefined();
        expect(response.body.users).toHaveLength(0);

        let roles = await helper.getMemberRoles("legolas@mail.com", tenant.id);

        for (let role of roles) {
            expect(role.name).not.toMatch(/ABC_ROLE|DEF_ROLE/);
        }

    });

    it(`Add User to Group`, async () => {
        const response = await app.getHttpServer()
            .post(`/api/group/${group.id}/add-users`)
            .send({
                "users": ["frodo@mail.com"]
            })
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Accept', 'application/json');

        console.log("Response: ", response.body);

        expect(response.status).toEqual(201);
        expect(response.body.group).toBeDefined();
        expect(response.body.group.name).toEqual("group-1");
        expect(response.body.group.tenantId).toEqual(tenant.id);
        expect(response.body.users).toBeDefined();
        expect(response.body.users).toHaveLength(1);
        expect(response.body.users[0].email).toEqual("frodo@mail.com");

        let roles = await helper.getMemberRoles("frodo@mail.com", tenant.id);

        for (let role of roles) {
            expect(role.name).toMatch(/ABC_ROLE|DEF_ROLE/);
        }

    });

    it(`Remove Roles from Group`, async () => {
        const response = await app.getHttpServer()
            .post(`/api/group/${group.id}/remove-roles`)
            .send({
                "roles": ["ABC_ROLE"]
            })
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Accept', 'application/json');

        console.log("Response: ", response.body);

        expect(response.status).toEqual(201);
        expect(response.body.group).toBeDefined();
        expect(response.body.group.name).toEqual("group-1");
        expect(response.body.group.tenantId).toEqual(tenant.id);
        expect(response.body.roles).toBeDefined();
        expect(response.body.roles).toHaveLength(1);
        for (let role of response.body.roles) {
            expect(role.name).toMatch(/DEF_ROLE/);
        }

        let roles = await helper.getMemberRoles("frodo@mail.com", tenant.id);

        for (let role of roles) {
            expect(role.name).toMatch(/DEF_ROLE/);
        }

    });

    it(`/Get Group`, async () => {
        const response = await app.getHttpServer()
            .get(`/api/group/${group.id}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Accept', 'application/json');

        console.log("Response: ", response.body);

        expect(response.status).toEqual(200);
        expect(response.body.group).toBeDefined();
        expect(response.body.group.id).toBeDefined();
        expect(response.body.group.name).toEqual("group-1");
        expect(response.body.group.tenantId).toEqual(tenant.id);
        expect(response.body.users).toBeDefined();
        expect(response.body.roles).toBeDefined();
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

