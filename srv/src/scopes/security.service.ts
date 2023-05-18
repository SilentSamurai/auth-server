import {Injectable, OnModuleInit} from '@nestjs/common';
import {AuthService} from "../auth/auth.service";
import {ExtractJwt} from 'passport-jwt';
import {ScopeEnum} from "./scope.enum";
import {ConfigService} from "../config/config.service";
import {ForbiddenException} from "../exceptions/forbidden.exception";
import {TenantService} from "../tenants/tenant.service";
import {UsersService} from "../users/users.service";
import {CaslAbilityFactory} from "./casl-ability.factory";
import {AnyAbility} from "@casl/ability/dist/types/PureAbility";

export enum GRANT_TYPES {
    PASSWORD = "password",
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

function extractTokenFromHeader(request: any) {
    let extractor = ExtractJwt.fromAuthHeaderAsBearerToken();
    return extractor(request)
}

@Injectable()
export class SecurityService implements OnModuleInit {
    constructor(private readonly configService: ConfigService,
                private readonly tenantService: TenantService,
                private readonly usersService: UsersService,
                private readonly authService: AuthService,
                private readonly caslAbilityFactory: CaslAbilityFactory) {

    }

    async onModuleInit() {
    }


    async setSecurityContextFromRequest(request: any) {
        const token = extractTokenFromHeader(request);
        const payload: SecurityContext = await this.authService.validateAccessToken(token);
        if (payload.grant_type === GRANT_TYPES.PASSWORD) {
            request['user'] = payload;
        }
        const ability = await this.caslAbilityFactory.createForSecurityContext(payload);
        request["SECURITY_CONTEXT"] = payload;
        request["SCOPE_ABILITIES"] = ability;
        return payload;
    }

    getAbility(request: any): AnyAbility {
        return request["SCOPE_ABILITIES"];
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
        return securityContext.scopes.some(scope => scope === ScopeEnum.SUPER_ADMIN)
            && securityContext.tenant.domain === this.configService.get("SUPER_TENANT_DOMAIN");
    }

}
