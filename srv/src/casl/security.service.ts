import {forwardRef, Inject, Injectable, OnModuleInit} from '@nestjs/common';

import {RoleEnum} from "../entity/roleEnum";
import {ConfigService} from "../config/config.service";
import {ForbiddenException} from "../exceptions/forbidden.exception";
import {CaslAbilityFactory} from "./casl-ability.factory";
import {AnyAbility} from "@casl/ability/dist/types/PureAbility";
import {Action} from "../entity/actions.enum";
import {subject} from "@casl/ability";

export enum GRANT_TYPES {
    PASSWORD = "password",
    CLIENT_CREDENTIALS = "client_credentials",
    CLIENT_CREDENTIAL = "client_credential",
    REFRESH_TOKEN = "refresh_token",
    CODE = "authorization_code"
}

export class SecurityContext {
    sub: string;
    email: string;
    name: string;
    tenant: {
        id: string;
        name: string;
        domain: string;
    };
    scopes: string[];
    grant_type: GRANT_TYPES
}

@Injectable()
export class SecurityService implements OnModuleInit {

    constructor(private readonly configService: ConfigService,
                @Inject(forwardRef(() => CaslAbilityFactory)) private readonly caslAbilityFactory: CaslAbilityFactory
    ) {
    }

    async onModuleInit() {
    }

    getAbility(request: any): AnyAbility {
        return request["SCOPE_ABILITIES"];
    }

    isAuthorized(request: any, action: Action, object: string, obj: any): boolean {
        return this.check(request, action, subject(object, obj));
    }

    check(request: any, ...args: any): boolean {
        let ability = this.getAbility(request);
        if (!ability.can(...args)) {
            throw new ForbiddenException();
        }
        return true;
    }

    getUserSecurityContext(request: any): SecurityContext {
        let payload = request["SECURITY_CONTEXT"] as SecurityContext;
        if (payload.grant_type !== GRANT_TYPES.PASSWORD) {
            throw new ForbiddenException("");
        }
        return payload;
    }

    getTechnicalSecurityContext(request: any): SecurityContext {
        let payload = request["SECURITY_CONTEXT"] as SecurityContext;
        if (payload.grant_type !== GRANT_TYPES.CLIENT_CREDENTIAL) {
            throw new ForbiddenException("");
        }
        return payload;
    }

    isClientCredentials(request: any) {
        let context = this.getUserOrTechnicalSecurityContext(request);
        return context.grant_type === GRANT_TYPES.CLIENT_CREDENTIAL
    }

    getUserOrTechnicalSecurityContext(request: any): SecurityContext {
        return request["SECURITY_CONTEXT"] as SecurityContext;
    }

    isAuthenticated(request: any) {
        return request.hasOwnProperty("SECURITY_CONTEXT");
    }

    isSuperAdmin(securityContext: SecurityContext) {
        return securityContext.scopes.some(scope => scope === RoleEnum.SUPER_ADMIN)
            && securityContext.tenant.domain === this.configService.get("SUPER_TENANT_DOMAIN");
    }

    getAdminContextForInternalUse() {
        const request = {};
        const payload = {
            email: '',
            tenant: {
                id: '',
                domain: this.configService.get("SUPER_TENANT_DOMAIN")
            },
            scopes: ["SUPER_ADMIN"]
        } as SecurityContext;
        const ability = this.caslAbilityFactory.createForSecurityContext(payload);
        request["SECURITY_CONTEXT"] = payload;
        request["SCOPE_ABILITIES"] = ability;
        return request;
    }
}
