import {AbilityBuilder, createMongoAbility} from "@casl/ability";
import {Action} from "./actions.enum";
import {Injectable} from "@nestjs/common";
import {RoleEnum} from "../entity/roleEnum";
import {AnyAbility} from "@casl/ability/dist/types/PureAbility";
import {SubjectEnum} from "../entity/subjectEnum";
import {Environment} from "../config/environment.service";
import {GRANT_TYPES, TenantToken} from "./contexts";
import {CacheService} from "./cache.service";
import {Role} from "../entity/role.entity";
import {Policy} from "../entity/authorization.entity";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";

@Injectable()
export class CaslAbilityFactory {
    constructor(
        private readonly configService: Environment,
        private readonly cacheService: CacheService,
        @InjectRepository(Role) private roleRepository: Repository<Role>,
        @InjectRepository(Policy)
        private authorizationRepository: Repository<Policy>,
    ) {
    }

    public async findRole(name: string, tenantId: string) {
        let cache_key = `ROLE:${tenantId}:${name}`;
        if (this.cacheService.has(cache_key)) {
            let role: Role = this.cacheService.get(cache_key);
            return role;
        } else {
            let role: Role = await this.roleRepository.findOne({
                where: {
                    name,
                    tenant: {id: tenantId},
                },
                relations: {
                    tenant: false,
                },
            });
            this.cacheService.set(cache_key, role);
            return role;
        }
    }

    async createForSecurityContext(
        tenantToken: TenantToken,
    ): Promise<AnyAbility> {
        const {can, cannot, build} = new AbilityBuilder(createMongoAbility);

        let roles = tenantToken.scopes;

        if (tenantToken.grant_type === GRANT_TYPES.CLIENT_CREDENTIALS) {
            can(Action.Read, SubjectEnum.TENANT, {id: tenantToken.tenant.id});
            can(Action.Read, SubjectEnum.MEMBER, {
                tenantId: tenantToken.tenant.id,
            });
            can(Action.Read, SubjectEnum.ROLE, {
                tenantId: tenantToken.tenant.id,
            });
            can(Action.ReadCredentials, SubjectEnum.TENANT, {
                id: tenantToken.tenant.id,
            });
            can(Action.Read, SubjectEnum.POLICY, {
                tenantId: tenantToken.tenant.id,
            });
        } else {
            // User Permissions
            cannot(Action.Manage, SubjectEnum.USER);
            can(Action.Manage, SubjectEnum.USER, {
                email: tenantToken.email,
            });
            can(Action.Manage, SubjectEnum.USER, {
                id: tenantToken.userId,
            });

            if (roles.includes(RoleEnum.TENANT_VIEWER)) {
                can(Action.Read, SubjectEnum.TENANT, {
                    id: tenantToken.tenant.id,
                });
                can(Action.Read, SubjectEnum.MEMBER, {
                    tenantId: tenantToken.tenant.id,
                });
                can(Action.Read, SubjectEnum.ROLE, {
                    tenantId: tenantToken.tenant.id,
                });
                can(Action.Read, SubjectEnum.POLICY, {
                    tenantId: tenantToken.tenant.id,
                });

                cannot(Action.ReadCredentials, SubjectEnum.TENANT);
            }

            if (roles.includes(RoleEnum.TENANT_ADMIN)) {
                can(Action.ReadCredentials, SubjectEnum.TENANT, {
                    id: tenantToken.tenant.id,
                });
                can(Action.Update, SubjectEnum.TENANT, {
                    id: tenantToken.tenant.id,
                });
                can(Action.Read, SubjectEnum.TENANT, {
                    id: tenantToken.tenant.id,
                });
                can(Action.Manage, SubjectEnum.MEMBER, {
                    tenantId: tenantToken.tenant.id,
                });
                can(Action.Manage, SubjectEnum.ROLE, {
                    tenantId: tenantToken.tenant.id,
                });
                can(Action.Manage, SubjectEnum.POLICY, {
                    tenantId: tenantToken.tenant.id,
                });
            }

            if (
                roles.includes(RoleEnum.SUPER_ADMIN) &&
                tenantToken.tenant.domain ===
                this.configService.get("SUPER_TENANT_DOMAIN")
            ) {
                can(Action.Manage, "all");
                can(Action.ReadCredentials, "all");
            }

            for (let name of roles) {
                let role = await this.findRole(name, tenantToken.tenant.id);
                if (!role) continue;

                can(Action.Manage, SubjectEnum.POLICY, {roleId: role.id});
            }
        }

        return build();
    }
}
