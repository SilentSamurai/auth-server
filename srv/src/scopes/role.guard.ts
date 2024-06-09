import {CanActivate, ExecutionContext, Injectable} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import {UsersService} from '../users/users.service';
import {RoleService} from "./role.service";
import {SecurityService} from "./security.service";
import {TenantService} from "../tenants/tenant.service";
import {RoleRule} from "./roles.decorator";
import {Action} from "./actions.enum";
import {SubjectEnum} from "./subjectEnum";
import {subject} from "@casl/ability";

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private readonly securityService: SecurityService,
        private readonly roleService: RoleService,
        private readonly tenantService: TenantService,
        private readonly usersService: UsersService
    ) {
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles: RoleRule[] = this.reflector.getAllAndOverride<RoleRule[]>('rules',
            [
                context.getHandler(),
                context.getClass()
            ]);

        if (!requiredRoles) {
            return true;
        }

        const request: any = context.switchToHttp().getRequest();
        if (!this.securityService.isAuthenticated(request)) {
            return false;
        }

        // let securityContext: SecurityContext = this.securityService.getUserOrTechnicalSecurityContext(request);
        const ability = this.securityService.getAbility(request);
        const cas = ability.can(Action.Read, subject(SubjectEnum.USER, {id: '6aeccc50-2f92-4368-9ae5-e0f24aaae2a6'}));
        console.log("cas ", cas);
        for (const requiredRole of requiredRoles) {
            if (!ability.can(requiredRole.action, subject(requiredRole.subject, {}))) {
                return false;
            }
        }
        return true;
    }
}
