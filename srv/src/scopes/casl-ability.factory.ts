import {AbilityBuilder, createMongoAbility} from "@casl/ability";
import {Action} from "./actions.enum";
import {Injectable} from "@nestjs/common";
import {ScopeEnum} from "./scope.enum";
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
        let scopes = securityContext.scopes;

        if (securityContext.grant_type === GRANT_TYPES.CLIENT_CREDENTIAL) {
            can(Action.Read, SubjectEnum.TENANT, {id: tenant.id});
            can(Action.Read, SubjectEnum.MEMBER, {tenantId: tenant.id});
            can(Action.Read, SubjectEnum.SCOPE, {tenantId: tenant.id});
            can(Action.ReadCredentials, SubjectEnum.TENANT, {id: tenant.id});
        } else {
            let user = await this.usersService.findByEmail(securityContext.email);

            // User Permissions
            can(Action.Manage, SubjectEnum.USER, {id: user.id});

            if (scopes.includes(ScopeEnum.TENANT_VIEWER)) {
                can(Action.Read, SubjectEnum.TENANT, {id: tenant.id});
                can(Action.Read, SubjectEnum.MEMBER, {tenantId: tenant.id});
                can(Action.Read, SubjectEnum.SCOPE, {tenantId: tenant.id});
                cannot(Action.ReadCredentials, SubjectEnum.TENANT);
            }

            if (scopes.includes(ScopeEnum.TENANT_ADMIN)) {
                can(Action.ReadCredentials, SubjectEnum.TENANT, {id: tenant.id});
                can(Action.Update, SubjectEnum.TENANT, {id: tenant.id});
                can(Action.Read, SubjectEnum.TENANT, {id: tenant.id});
                can(Action.Manage, SubjectEnum.MEMBER, {tenantId: tenant.id});
                can(Action.Manage, SubjectEnum.SCOPE, {tenantId: tenant.id});
            }

            if (scopes.includes(ScopeEnum.SUPER_ADMIN) && tenant.domain === this.configService.get("SUPER_TENANT_DOMAIN")) {
                can(Action.Manage, 'all');
                can(Action.ReadCredentials, 'all');
            }


        }


        return build();
    }
}
