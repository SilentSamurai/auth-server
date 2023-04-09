import {CanActivate, ExecutionContext, Injectable} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import {UsersService} from '../users/users.service';
import {ScopeEnum} from './scope.enum';
import {ScopeService} from "./scope.service";
import {SecurityService} from "./security.service";
import {SecurityContext} from "../auth/auth.service";
import {TenantService} from "../tenants/tenant.service";

@Injectable()
export class ScopeGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private readonly securityService: SecurityService,
        private readonly scopeService: ScopeService,
        private readonly tenantService: TenantService,
        private readonly usersService: UsersService,
    ) {
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredScopes: ScopeEnum[] = this.reflector.getAllAndOverride<ScopeEnum[]>('scopes',
            [
                context.getHandler(),
                context.getClass()
            ]);

        if (!requiredScopes) {
            return true;
        }

        const request: any = context.switchToHttp().getRequest();
        if (!this.securityService.isAuthenticated(request)) {
            return false;
        }

        let securityContext: SecurityContext = this.securityService.getSecurityContext(request);

        // const user: User = await this.usersService.findByEmail(securityContext.email);
        // const tenant: Tenant = await this.tenantService.findById(securityContext.tenant.id);
        //
        // let scopes = await this.scopeService.getMemberScopes(tenant, user);
        if (this.securityService.isSuperAdmin(securityContext)) {
            return true;
        }
        return requiredScopes.some(scope => securityContext.scopes.includes(scope));
    }
}
