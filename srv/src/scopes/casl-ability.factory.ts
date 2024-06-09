import {AbilityBuilder, createMongoAbility} from "@casl/ability";
import {Action} from "./actions.enum";
import {Injectable} from "@nestjs/common";
import {RoleEnum} from "./roleEnum";
import {UsersService} from "../users/users.service";
import {TenantService} from "../tenants/tenant.service";
import {GRANT_TYPES, SecurityContext} from "./security.service";
import {AnyAbility} from "@casl/ability/dist/types/PureAbility";
import {SubjectEnum} from "./subjectEnum";
import {ConfigService} from "../config/config.service";


@Injectable()
export class CaslAbilityFactory {

    constructor(
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
        private readonly tenantService: TenantService
    ) {
    }

    async createForSecurityContext(securityContext: SecurityContext): Promise<AnyAbility> {
        const {can, cannot, build} = new AbilityBuilder(createMongoAbility);

        let tenant = await this.tenantService.findById(securityContext.tenant.id);
        let roles = securityContext.scopes;

        if (securityContext.grant_type === GRANT_TYPES.CLIENT_CREDENTIAL) {
            can(Action.Read, SubjectEnum.TENANT, {id: tenant.id});
            can(Action.Read, SubjectEnum.MEMBER, {tenantId: tenant.id});
            can(Action.Read, SubjectEnum.ROLE, {tenantId: tenant.id});
            can(Action.ReadCredentials, SubjectEnum.TENANT, {id: tenant.id});
        } else {
            let user = await this.usersService.findByEmail(securityContext.email);

            // User Permissions
            cannot(Action.Manage, SubjectEnum.USER);
            can(Action.Manage, SubjectEnum.USER, {
                id: {$eq: user.id}
            });


            if (roles.includes(RoleEnum.TENANT_VIEWER)) {
                can(Action.Read, SubjectEnum.TENANT, {id: tenant.id});
                can(Action.Read, SubjectEnum.MEMBER, {tenantId: tenant.id});
                can(Action.Read, SubjectEnum.ROLE, {tenantId: tenant.id});
                cannot(Action.ReadCredentials, SubjectEnum.TENANT);
            }

            if (roles.includes(RoleEnum.TENANT_ADMIN)) {
                can(Action.ReadCredentials, SubjectEnum.TENANT, {id: tenant.id});
                can(Action.Update, SubjectEnum.TENANT, {id: tenant.id});
                can(Action.Read, SubjectEnum.TENANT, {id: tenant.id});
                can(Action.Manage, SubjectEnum.MEMBER, {tenantId: tenant.id});
                can(Action.Manage, SubjectEnum.ROLE, {tenantId: tenant.id});
            }

            if (roles.includes(RoleEnum.SUPER_ADMIN) && tenant.domain === this.configService.get("SUPER_TENANT_DOMAIN")) {
                can(Action.Manage, 'all');
                can(Action.ReadCredentials, 'all');
            }


        }

        return build();
    }
}
