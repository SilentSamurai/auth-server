import {Injectable, OnModuleInit} from '@nestjs/common';
import {AuthService} from "../auth/auth.service";
import {ExtractJwt} from 'passport-jwt';
import {ScopeEnum} from "./scope.enum";
import {ConfigService} from "../config/config.service";
import {Tenant} from "../tenants/tenant.entity";
import {User} from "../users/user.entity";
import {ForbiddenException} from "../exceptions/forbidden.exception";
import {TenantService} from "../tenants/tenant.service";
import {UsersService} from "../users/users.service";

export enum GRANT_TYPES {
    PASSWORD = "password",
    CLIENT_CREDENTIAL = "client_credential",
    REFRESH_TOKEN = "refresh_token"
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
                private readonly authService: AuthService) {

    }

    async onModuleInit() {
    }


    async setSecurityContextFromRequest(request: any) {
        const token = extractTokenFromHeader(request);
        const payload: SecurityContext = await this.authService.validateAccessToken(token);
        if (payload.grant_type === GRANT_TYPES.PASSWORD) {
            request['user'] = payload;
        }
        request["SECURITY_CONTEXT"] = payload;
        return payload;
    }

    async setSecurityContextFromToken(token: string): Promise<SecurityContext> {
        return this.authService.validateAccessToken(token);
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

    async currentUserShouldBeTenantAdmin(request, domain: string,) {
        const securityContext = this.getUserSecurityContext(request);
        const tenant: Tenant = await this.tenantService.findByDomain(domain);
        const user: User = await this.usersService.findByEmail(securityContext.email);
        let isAdmin = await this.tenantService.isAdmin(tenant.id, user);
        if (!isAdmin) {
            throw new ForbiddenException("only admin can update tenant info.");
        }
    }

    async currentUserShouldBeTenantViewer(request, domain: string,) {
        const securityContext = this.getUserSecurityContext(request);
        const tenant: Tenant = await this.tenantService.findByDomain(domain);
        const user: User = await this.usersService.findByEmail(securityContext.email);
        let viewer = await this.tenantService.isViewer(tenant.id, user);
        if (!viewer) {
            throw new ForbiddenException("access to this tenant is denied.");
        }
    }

    async contextShouldBeTenantViewer(request, domain: string,) {
        const securityContext = this.getUserOrTechnicalSecurityContext(request);
        const tenant: Tenant = await this.tenantService.findByDomain(domain);
        if (this.isClientCredentials(request)) {
            if (securityContext.scopes.find(scope => scope === ScopeEnum.TENANT_VIEWER) === undefined) {
                throw new ForbiddenException("access to this tenant is denied.");
            }
        } else {
            const user: User = await this.usersService.findByEmail(securityContext.email);
            let viewer = await this.tenantService.isViewer(tenant.id, user);
            if (!viewer) {
                throw new ForbiddenException("access to this tenant is denied.");
            }
        }
    }

}
