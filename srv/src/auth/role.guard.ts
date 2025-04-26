import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UsersService } from "../services/users.service";
import { RoleService } from "../services/role.service";
import { SecurityService } from "../casl/security.service";
import { TenantService } from "../services/tenant.service";
import { RoleRule } from "../casl/roles.decorator";
import { Action } from "../casl/actions.enum";
import { SubjectEnum } from "../entity/subjectEnum";
import { subject } from "@casl/ability";

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly securityService: SecurityService,
    private readonly roleService: RoleService,
    private readonly tenantService: TenantService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles: RoleRule[] = this.reflector.getAllAndOverride<
      RoleRule[]
    >("rules", [context.getHandler(), context.getClass()]);

    if (!requiredRoles) {
      return true;
    }

    const request: any = context.switchToHttp().getRequest();
    if (!this.securityService.isAuthenticated(request)) {
      return false;
    }

    // let securityContext: SecurityContext = this.securityService.getUserOrTechnicalSecurityContext(request);
    const ability = this.securityService.getAbility(request);
    const cas = ability.can(
      Action.Read,
      subject(SubjectEnum.USER, { id: "6aeccc50-2f92-4368-9ae5-e0f24aaae2a6" }),
    );
    console.log("cas ", cas);
    for (const requiredRole of requiredRoles) {
      if (
        !ability.can(requiredRole.action, subject(requiredRole.subject, {}))
      ) {
        return false;
      }
    }
    return true;
  }
}
