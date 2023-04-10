import {Injectable, OnModuleInit} from "@nestjs/common";
import {ConfigService} from "./config/config.service";
import {UsersService} from "./users/users.service";
import {ScopeService} from "./scopes/scope.service";
import {TenantService} from "./tenants/tenant.service";
import {User} from "./users/user.entity";
import {readFile} from "fs";
import {Tenant} from "./tenants/tenant.entity";
import {ScopeEnum} from "./scopes/scope.enum";
import {DataSource} from "typeorm/data-source/DataSource";

@Injectable()
export class StartUpService implements OnModuleInit {


    constructor(
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
        private readonly tenantService: TenantService,
        private readonly scopeService: ScopeService,
        private dataSource: DataSource
    ) {
    }

    async onModuleInit(): Promise<any> {
        await this.dataSource.runMigrations({
            transaction: "all"
        })
        if (!this.configService.isProduction()) {
            await this.populateDummyUsers();
        }
        await this.createAdminUser();
        await this.populateGlobalTenant();
    }

    async createAdminUser() {
        try {
            if (!await this.usersService.existByEmail(this.configService.get("SUPER_ADMIN_EMAIL"))) {
                let user: User = await this.usersService.create(
                    this.configService.get("SUPER_ADMIN_PASSWORD"),
                    this.configService.get("SUPER_ADMIN_EMAIL"),
                    this.configService.get("SUPER_ADMIN_NAME")
                );

                await this.usersService.updateVerified(user.id, true);
            }
        } catch (exception: any) {
            // Catch user already created.
        }
    }

    async populateDummyUsers() {
        readFile('./users.json', 'utf8', (error, data) => {
            if (error) {
                return
            }

            const users: any = JSON.parse(data);
            users.records.forEach(async record => {
                try {
                    let user: User = await this.usersService.create(
                        record.password,
                        record.email,
                        record.name
                    );

                    await this.usersService.updateVerified(user.id, true);
                } catch (exception: any) {
                    // Catch user already created.
                }
            });
        });
    }

    async populateGlobalTenant() {
        const user = await this.usersService.findByEmail(this.configService.get("SUPER_ADMIN_EMAIL"));
        const tenant: Tenant = await this.tenantService.findByDomain(this.configService.get("SUPER_TENANT_DOMAIN"));
        const scopeSuperAdmin = await this.scopeService.findByNameAndTenant(ScopeEnum.SUPER_ADMIN, tenant);
        const scopeAdmin = await this.scopeService.findByNameAndTenant(ScopeEnum.TENANT_ADMIN, tenant);
        const scopeViewer = await this.scopeService.findByNameAndTenant(ScopeEnum.TENANT_VIEWER, tenant);
        await this.scopeService.updateUserScopes([scopeAdmin.name, scopeViewer.name, scopeSuperAdmin.name], tenant, user);
        try {
            let globalTenantExists = await this.tenantService.existByDomain(this.configService.get("SUPER_TENANT_DOMAIN"));
            if (!globalTenantExists) {
                const user = await this.usersService.findByEmail(this.configService.get("SUPER_ADMIN_EMAIL"));
                const tenant: Tenant = await this.tenantService.create(
                    this.configService.get("SUPER_TENANT_NAME"),
                    this.configService.get("SUPER_TENANT_DOMAIN"),
                    user
                );
                const scopeAdmin = await this.scopeService.findByNameAndTenant(ScopeEnum.TENANT_ADMIN, tenant);
                const scopeViewer = await this.scopeService.findByNameAndTenant(ScopeEnum.TENANT_VIEWER, tenant);
                const scopeSuperAdmin = await this.scopeService.create(ScopeEnum.SUPER_ADMIN, tenant, false);
                await this.scopeService.updateUserScopes([scopeAdmin.name, scopeViewer.name, scopeSuperAdmin.name], tenant, user);
            }
        } catch (e) {
            console.error(e);
        }
    }

}
