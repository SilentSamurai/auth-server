import {TestAppFixture} from "./test-app.fixture";
import {TenantClient} from "./api-client/tenant-client";
import {RoleClient} from "./api-client/role-client";
import {GroupClient} from "./api-client/group-client";
import {UsersClient} from "./api-client/user-client";
import * as process from "node:process";

export class HelperFixture {

    public tenant: TenantClient;
    public role: RoleClient;
    public group: GroupClient;
    public user: UsersClient;
    private readonly app: TestAppFixture;
    private accessToken: string;

    constructor(app: TestAppFixture, accessToken: string) {
        this.app = app;
        this.accessToken = accessToken;
        this.tenant = new TenantClient(app, accessToken);
        this.role = new RoleClient(app, accessToken);
        this.group = new GroupClient(app, accessToken);
        this.user = new UsersClient(app, accessToken);
    }

}


export function setupConsole() {
    if (
        process.env.CUSTOM_LOG && process.env.CUSTOM_LOG.includes("1")
    ) {
        global.console = require('console');
    }
}
