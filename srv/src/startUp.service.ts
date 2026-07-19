import {Injectable, Logger, OnModuleInit} from "@nestjs/common";
import {Environment} from "./config/environment.service";
import {UsersService} from "./services/users.service";
import {RoleService} from "./services/role.service";
import {TenantService} from "./services/tenant.service";
import {ClientService} from "./services/client.service";
import {User} from "./entity/user.entity";
import {Tenant} from "./entity/tenant.entity";
import {RoleEnum} from "./entity/roleEnum";
import {DataSource} from "typeorm/data-source/DataSource";
import {SecurityService} from "./casl/security.service";
import {SeedService} from "./seed.service";
import {Permission} from "./auth/auth.decorator";

@Injectable()
export class StartUpService implements OnModuleInit {
    private readonly logger = new Logger("StartUpService");

    constructor(
        private readonly configService: Environment,
        private readonly usersService: UsersService,
        private readonly tenantService: TenantService,
        private readonly roleService: RoleService,
        private readonly clientService: ClientService,
        private readonly securityService: SecurityService,
        private readonly seedService: SeedService,
        private dataSource: DataSource,
    ) {
    }

    // Password shipped in the committed env files for local/dev/test use only.
    // A production deployment must inject a real SUPER_ADMIN_PASSWORD.
    private static readonly INSECURE_DEFAULT_ADMIN_PASSWORD = "admin9000";

    async onModuleInit(): Promise<any> {
        this.assertProductionAdminSecretIsSafe();

        await this.dataSource.runMigrations({
            transaction: "all",
        });
        if (!this.configService.isProduction()) {
            await this.seedService.populateDummyUsers();
            await this.seedService.createDummyTenantAndUser();
            await this.seedService.createDummyAppsGroupsRoles();
        }
        await this.createAdminUser();
        await this.populateGlobalTenant();
    }

    /**
     * Refuse to boot a production instance whose super-admin password is missing
     * or is the well-known default baked into the committed env files. Otherwise
     * the very first account — a full super admin — would have a password that is
     * public in the repository. This must run outside createAdminUser(), whose
     * try/catch would otherwise swallow the failure and let startup continue.
     */
    private assertProductionAdminSecretIsSafe(): void {
        if (!this.configService.isProduction()) {
            return;
        }
        const password = this.configService.get("SUPER_ADMIN_PASSWORD");
        if (!password || password === StartUpService.INSECURE_DEFAULT_ADMIN_PASSWORD) {
            throw new Error(
                "SUPER_ADMIN_PASSWORD must be set to a strong, non-default value in production. " +
                "Inject it via the environment (e.g. a Kubernetes secret); do not rely on the " +
                "committed env file default.",
            );
        }
    }

    async createAdminUser() {
        try {
            const permission = this.securityService.createPermissionForStartupSeed();
            if (
                !(await this.usersService.existByEmail(
                    permission,
                    this.configService.get("SUPER_ADMIN_EMAIL"),
                ))
            ) {
                let user: User = await this.usersService.create(
                    permission,
                    this.configService.get("SUPER_ADMIN_PASSWORD"),
                    this.configService.get("SUPER_ADMIN_EMAIL"),
                    this.configService.get("SUPER_ADMIN_NAME"),
                );

                await this.usersService.updateVerified(
                    permission,
                    user.id,
                    true,
                );

                await this.createDefaultAdminUser(permission);
            }
        } catch (exception: any) {
            // Catch user already created.
            console.error(exception);
        }
    }

    /**
     * Create the optional default admin account from DEFAULT_ADMIN_EMAIL /
     * DEFAULT_ADMIN_PASSWORD. Both must be set, so an account with a known
     * password is never created implicitly on a deployment that didn't ask for one.
     */
    private async createDefaultAdminUser(permission: Permission) {
        const email = this.configService.get("DEFAULT_ADMIN_EMAIL");
        const password = this.configService.get("DEFAULT_ADMIN_PASSWORD");

        if (!email || !password) {
            return;
        }

        if (await this.usersService.existByEmail(permission, email)) {
            return;
        }

        const defaultAdmin: User = await this.usersService.create(
            permission,
            password,
            email,
            this.configService.get("DEFAULT_ADMIN_NAME", "admin"),
        );

        await this.usersService.updateVerified(
            permission,
            defaultAdmin.id,
            true,
        );

        this.logger.log(`Created default admin user: ${email}`);
    }

    async populateGlobalTenant() {
        try {
            const permission = this.securityService.createPermissionForStartupSeed();
            let globalTenantExists = await this.tenantService.existByDomain(
                permission,
                this.configService.get("SUPER_TENANT_DOMAIN"),
            );
            if (!globalTenantExists) {
                const user = await this.usersService.findByEmail(
                    permission,
                    this.configService.get("SUPER_ADMIN_EMAIL"),
                );
                const tenant: Tenant = await this.tenantService.create(
                    permission,
                    this.configService.get("SUPER_TENANT_NAME"),
                    this.configService.get("SUPER_TENANT_DOMAIN"),
                    user,
                );
                const adminRole = await this.roleService.findByNameAndTenant(
                    permission,
                    RoleEnum.TENANT_ADMIN,
                    tenant,
                );
                const viewerRole = await this.roleService.findByNameAndTenant(
                    permission,
                    RoleEnum.TENANT_VIEWER,
                    tenant,
                );
                const superAdminRole = await this.roleService.create(
                    permission,
                    RoleEnum.SUPER_ADMIN,
                    tenant,
                    false,
                );
                await this.roleService.updateUserRoles(
                    permission,
                    [adminRole.name, viewerRole.name, superAdminRole.name],
                    tenant,
                    user,
                );

                const normalUser = await this.usersService.findByEmail(
                    permission,
                    "admin@mail.com",
                );

                const isMember = await this.tenantService.isMember(permission, tenant.id, normalUser)
                if (!isMember) {
                    await this.tenantService.addMember(permission, tenant.id, normalUser);

                    await this.roleService.updateUserRoles(
                        permission,
                        [viewerRole.name],
                        tenant,
                        normalUser,
                    );
                }
            }

            try {
                const superTenantDomain = this.configService.get("SUPER_TENANT_DOMAIN");
                const defaultClient = await this.clientService.findByAlias(superTenantDomain);
                const adminUiCallbackUris = this.seedService.resolveAdminUiCallbackUris();
                const existing = new Set(defaultClient.redirectUris || []);
                const merged = Array.from(new Set([...existing, ...adminUiCallbackUris, 'http://localhost:3000/callback']));

                await this.clientService.updateClient(permission, defaultClient.clientId, {
                    allowPasswordGrant: true,
                    redirectUris: merged,
                });
                this.logger.log(
                    `Configured super tenant default client (${superTenantDomain}) with redirect URIs: ${merged.join(', ')}`,
                );
            } catch (e) {
                this.logger.warn(`Could not configure super tenant default client: ${e}`);
            }
        } catch (e) {
            console.error(e);
        }
    }
}
