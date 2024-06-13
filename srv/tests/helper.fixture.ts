import {TestAppFixture} from "./test-app.fixture";
import {TenantClient} from "./api-client/tenant-client";
import {RoleClient} from "./api-client/role-client";
import {GroupClient} from "./api-client/group-client";

export class HelperFixture {

    private readonly app: TestAppFixture;
    private accessToken: string;

    public tenant: TenantClient;
    public role: RoleClient;
    public group: GroupClient;

    constructor(app: TestAppFixture, accessToken: string) {
        this.app = app;
        this.accessToken = accessToken;
        this.tenant = new TenantClient(app, accessToken);
        this.role = new RoleClient(app, accessToken);
        this.group = new GroupClient(app, accessToken);
    }

}
