import {CanActivate, ExecutionContext, Injectable} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import {UsersService} from '../users/users.service';
import {ScopeEnum} from './scope.enum';
import {ScopeService} from "./scope.service";
import {SecurityContext, SecurityService} from "./security.service";
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
        const providedTenantId = request.params["tenantId"] || null;
        if (!this.securityService.isAuthenticated(request)) {
            return false;
        }

        let securityContext: SecurityContext = this.securityService.getUserOrTechnicalSecurityContext(request);
        if (this.securityService.isClientCredentials(request)) {
            if (providedTenantId !== null && providedTenantId !== securityContext.tenant.id) {
                console.log("Forbidden tenant id and token id mismatch");
                return false;
            }
        } else {
            if (this.securityService.isSuperAdmin(securityContext)) {
                return true;
            }
            if (providedTenantId !== null && providedTenantId !== securityContext.tenant.id) {
                console.log("Forbidden tenant id and token id mismatch");
                return false;
            }
        }

        // const user: User = await this.usersService.findByEmail(securityContext.email);
        // const tenant: Tenant = await this.tenantService.findById(securityContext.tenant.id);
        //
        // let scopes = await this.scopeService.getMemberScopes(tenant, user);

        return requiredScopes.some(scope => securityContext.scopes.includes(scope));
    }
}
