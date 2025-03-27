import {Injectable, OnModuleInit} from "@nestjs/common";
import {Environment} from "./config/environment.service";
import {UsersService} from "./services/users.service";
import {RoleService} from "./services/role.service";
import {TenantService} from "./services/tenant.service";
import {User} from "./entity/user.entity";
import {readFile} from "fs";
import {Tenant} from "./entity/tenant.entity";
import {RoleEnum} from "./entity/roleEnum";
import {DataSource} from "typeorm/data-source/DataSource";
import {SecurityService} from "./casl/security.service";

@Injectable()
export class StartUpService implements OnModuleInit {


    constructor(
        private readonly configService: Environment,
        private readonly usersService: UsersService,
        private readonly tenantService: TenantService,
        private readonly roleService: RoleService,
        private readonly securityService: SecurityService,
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
            let adminContext = this.securityService.getAdminContextForInternalUse();
            if (!await this.usersService.existByEmail(adminContext, this.configService.get("SUPER_ADMIN_EMAIL"))) {
                let user: User = await this.usersService.create(
                    adminContext,
                    this.configService.get("SUPER_ADMIN_PASSWORD"),
                    this.configService.get("SUPER_ADMIN_EMAIL"),
                    this.configService.get("SUPER_ADMIN_NAME")
                );

                await this.usersService.updateVerified(adminContext, user.id, true);
            }
        } catch (exception: any) {
            // Catch user already created.
            console.error(exception);
        }
    }

    async populateDummyUsers() {
        readFile('./users.json', 'utf8', (error, data) => {
            if (error) {
                return
            }
            let adminContext = this.securityService.getAdminContextForInternalUse();
            const users: any = JSON.parse(data);
            users.records.forEach(async record => {
                try {

                    const isPresent = await this.usersService.existByEmail(adminContext, record.email);

                    if (!isPresent) {
                        let user: User = await this.usersService.create(
                            adminContext,
                            record.password,
                            record.email,
                            record.name
                        );

                        await this.usersService.updateVerified(adminContext, user.id, true);
                    }
                } catch (exception: any) {
                    // Catch user already created.
                    console.error(exception);
                }
            });
        });
    }

    async populateGlobalTenant() {
        try {
            let adminContext = this.securityService.getAdminContextForInternalUse();
            let globalTenantExists = await this.tenantService.existByDomain(adminContext, this.configService.get("SUPER_TENANT_DOMAIN"));
            if (!globalTenantExists) {
                const user = await this.usersService.findByEmail(adminContext, this.configService.get("SUPER_ADMIN_EMAIL"));
                const tenant: Tenant = await this.tenantService.create(
                    adminContext,
                    this.configService.get("SUPER_TENANT_NAME"),
                    this.configService.get("SUPER_TENANT_DOMAIN"),
                    user
                );
                const adminRole = await this.roleService.findByNameAndTenant(adminContext, RoleEnum.TENANT_ADMIN, tenant);
                const viewerRole = await this.roleService.findByNameAndTenant(adminContext, RoleEnum.TENANT_VIEWER, tenant);
                const superAdminRole = await this.roleService.create(adminContext, RoleEnum.SUPER_ADMIN, tenant, false);
                await this.roleService.updateUserRoles(adminContext, [adminRole.name, viewerRole.name, superAdminRole.name], tenant, user);
            }
        } catch (e) {
            console.error(e);
        }
    }

}
