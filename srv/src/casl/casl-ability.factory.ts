import {AbilityBuilder, createMongoAbility} from "@casl/ability";
import {Action} from "../entity/actions.enum";
import {Injectable} from "@nestjs/common";
import {RoleEnum} from "../entity/roleEnum";
import {GRANT_TYPES, SecurityContext} from "./security.service";
import {AnyAbility} from "@casl/ability/dist/types/PureAbility";
import {SubjectEnum} from "../entity/subjectEnum";
import {ConfigService} from "../config/config.service";


@Injectable()
export class CaslAbilityFactory {

    constructor(
        private readonly configService: ConfigService,
    ) {
    }

    createForSecurityContext(securityContext: SecurityContext): AnyAbility {
        const {can, cannot, build} = new AbilityBuilder(createMongoAbility);

        let roles = securityContext.scopes;

        if (securityContext.grant_type === GRANT_TYPES.CLIENT_CREDENTIAL) {
            can(Action.Read, SubjectEnum.TENANT, {id: securityContext.tenant.id});
            can(Action.Read, SubjectEnum.MEMBER, {tenantId: securityContext.tenant.id});
            can(Action.Read, SubjectEnum.ROLE, {tenantId: securityContext.tenant.id});
            can(Action.ReadCredentials, SubjectEnum.TENANT, {id: securityContext.tenant.id});
        } else {

            // User Permissions
            cannot(Action.Manage, SubjectEnum.USER);
            can(Action.Manage, SubjectEnum.USER, {
                email: {$eq: securityContext.email}
            });


            if (roles.includes(RoleEnum.TENANT_VIEWER)) {
                can(Action.Read, SubjectEnum.TENANT, {id: securityContext.tenant.id});
                can(Action.Read, SubjectEnum.MEMBER, {tenantId: securityContext.tenant.id});
                can(Action.Read, SubjectEnum.ROLE, {tenantId: securityContext.tenant.id});
                cannot(Action.ReadCredentials, SubjectEnum.TENANT);
            }

            if (roles.includes(RoleEnum.TENANT_ADMIN)) {
                can(Action.ReadCredentials, SubjectEnum.TENANT, {id: securityContext.tenant.id});
                can(Action.Update, SubjectEnum.TENANT, {id: securityContext.tenant.id});
                can(Action.Read, SubjectEnum.TENANT, {id: securityContext.tenant.id});
                can(Action.Manage, SubjectEnum.MEMBER, {tenantId: securityContext.tenant.id});
                can(Action.Manage, SubjectEnum.ROLE, {tenantId: securityContext.tenant.id});
            }

            if (roles.includes(RoleEnum.SUPER_ADMIN) && securityContext.tenant.domain === this.configService.get("SUPER_TENANT_DOMAIN")) {
                can(Action.Manage, 'all');
                can(Action.ReadCredentials, 'all');
            }


        }

        return build();
    }
}
