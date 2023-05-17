import {CanActivate, ExecutionContext, Injectable} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import {UsersService} from '../users/users.service';
import {ScopeService} from "./scope.service";
import {SecurityService} from "./security.service";
import {TenantService} from "../tenants/tenant.service";
import {ScopeRule} from "./scopes.decorator";

@Injectable()
export class ScopeGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private readonly securityService: SecurityService,
        private readonly scopeService: ScopeService,
        private readonly tenantService: TenantService,
        private readonly usersService: UsersService
    ) {
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredScopes: ScopeRule[] = this.reflector.getAllAndOverride<ScopeRule[]>('rules',
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

        // let securityContext: SecurityContext = this.securityService.getUserOrTechnicalSecurityContext(request);
        const ability = this.securityService.getAbility(request);
        // const cas = ability.can(Action.Manage, subject(SubjectEnum.USER, {id: '6aeccc50-2f92-4368-9ae5-e0f24aaae2a6'}));
        // console.log("cas ", cas);
        for (const requiredScope of requiredScopes) {
            if (!ability.can(requiredScope.action, requiredScope.subject)) {
                return false;
            }
        }
        return true;
    }
}
