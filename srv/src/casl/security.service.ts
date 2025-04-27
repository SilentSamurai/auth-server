import {forwardRef, Inject, Injectable, OnModuleInit} from '@nestjs/common';

import {RoleEnum} from "../entity/roleEnum";
import {Environment} from "../config/environment.service";
import {ForbiddenException} from "../exceptions/forbidden.exception";
import {CaslAbilityFactory} from "./casl-ability.factory";
import {AnyAbility} from "@casl/ability/dist/types/PureAbility";
import {Action} from "./actions.enum";
import {subject} from "@casl/ability";
import {AuthUserService} from "./authUser.service";
import {AuthContext, GRANT_TYPES, OAuthToken, TechnicalToken, TenantToken, UserToken} from "./contexts";


@Injectable()
export class SecurityService implements OnModuleInit {

    constructor(private readonly configService: Environment,
                private readonly authUserService: AuthUserService,
                @Inject(forwardRef(() => CaslAbilityFactory)) private readonly caslAbilityFactory: CaslAbilityFactory
    ) {
    }

    async onModuleInit() {
    }

    getAbility(authContext: AuthContext): AnyAbility {
        return authContext.SCOPE_ABILITIES;
    }

    isAuthorized(authContext: AuthContext, action: Action, object: string, obj: any = null): boolean {
        if (obj == null) {
            return this.check(authContext, action, object);
        }
        return this.check(authContext, action, subject(object, obj));
    }

    check(authContext: AuthContext, ...args: any): boolean {
        let ability = this.getAbility(authContext);
        if (!ability.can(...args)) {
            throw new ForbiddenException();
        }
        return true;
    }

    getUserToken(authContext: AuthContext): UserToken {
        let payload = authContext.SECURITY_CONTEXT;
        if (payload.grant_type !== GRANT_TYPES.PASSWORD) {
            throw new ForbiddenException("");
        }
        return payload;
    }

    getTechnicalSecurityContext(authContext: any): OAuthToken {
        let payload = authContext.SECURITY_CONTEXT;
        if (payload.grant_type !== GRANT_TYPES.CLIENT_CREDENTIAL) {
            throw new ForbiddenException("");
        }
        return payload;
    }

    isClientCredentials(request: any) {
        let context = this.getUserOrTechnicalSecurityContext(request);
        return context.grant_type === GRANT_TYPES.CLIENT_CREDENTIAL || context.grant_type === GRANT_TYPES.CLIENT_CREDENTIALS
    }

    getTechnicalToken(authContext: AuthContext): TechnicalToken {
        if (!this.isClientCredentials(authContext)) {
            throw new ForbiddenException("");
        }
        return this.getUserOrTechnicalSecurityContext(authContext) as TechnicalToken;
    }

    getUserOrTechnicalSecurityContext(request: any): TenantToken {
        return request["SECURITY_CONTEXT"] as TenantToken;
    }

    isAuthenticated(request: any) {
        return request.hasOwnProperty("SECURITY_CONTEXT");
    }

    isSuperAdmin(securityContext: TenantToken) {
        return securityContext.scopes.some(scope => scope === RoleEnum.SUPER_ADMIN)
            && securityContext.tenant.domain === this.configService.get("SUPER_TENANT_DOMAIN");
    }

    async getAdminContextForInternalUse(): Promise<AuthContext> {
        const authContext: AuthContext = {
            SECURITY_CONTEXT: {
                email: '',
                sub: '',
                userId: '',
                name: '',
                tenant: {
                    id: '',
                    name: "",
                    domain: this.configService.get("SUPER_TENANT_DOMAIN")
                },
                scopes: ["SUPER_ADMIN"],
                grant_type: GRANT_TYPES.PASSWORD
            } as TenantToken,
            SCOPE_ABILITIES: null
        };
        authContext.SCOPE_ABILITIES = await this.caslAbilityFactory.createForSecurityContext(authContext.SECURITY_CONTEXT);
        return authContext;
    }

    async getUserAuthContext(email: string): Promise<AuthContext> {
        const user = await this.authUserService.findUserByEmail(email);
        const authContext: AuthContext = {
            SECURITY_CONTEXT: {
                email: user.email,
                sub: user.email,
                userId: user.id,
                name: user.name,
                scopes: [],
                grant_type: GRANT_TYPES.CODE
            } as UserToken,
            SCOPE_ABILITIES: null
        };
        authContext.SCOPE_ABILITIES = await this.caslAbilityFactory.createForSecurityContext(authContext.SECURITY_CONTEXT);
        return authContext;
    }

    async getUserTenantAuthContext(email: string, domain: string): Promise<AuthContext> {
        const user = await this.authUserService.findUserByEmail(email);
        const tenant = await this.authUserService.findTenantByDomain(domain);
        const roles = await this.authUserService.findMemberRoles(tenant, user);
        const authContext: AuthContext = {
            SECURITY_CONTEXT: {
                email: user.email,
                sub: user.email,
                userId: user.id,
                name: user.name,
                tenant: {
                    id: tenant.id,
                    name: tenant.name,
                    domain: tenant.domain
                },
                scopes: roles.map(item => item.name),
                grant_type: GRANT_TYPES.CODE
            } as TenantToken,
            SCOPE_ABILITIES: null
        };
        authContext.SCOPE_ABILITIES = await this.caslAbilityFactory.createForSecurityContext(authContext.SECURITY_CONTEXT);
        return authContext;
    }

    async getAuthContextFromSecurityContext(securityContext: TenantToken): Promise<AuthContext> {
        const authContext: AuthContext = {
            SECURITY_CONTEXT: securityContext,
            SCOPE_ABILITIES: null
        };
        authContext.SCOPE_ABILITIES = await this.caslAbilityFactory.createForSecurityContext(securityContext);
        return authContext;
    }
}
