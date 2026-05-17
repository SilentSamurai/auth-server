import {BadRequestException, Injectable} from "@nestjs/common";
import {randomUUID} from "crypto";
import {ScopeResolverService} from "../casl/scope-resolver.service";
import {TenantService} from "../services/tenant.service";
import {PolicyResolutionService} from "../casl/policy-resolution.service";
import {LoginSessionService} from "./login-session.service";
import {SecurityEventLogger} from "../security/security-event-logger.service";
import {Client} from "../entity/client.entity";
import {Role} from "../entity/role.entity";
import {User} from "../entity/user.entity";
import {Permission} from "./auth.decorator";
import {GRANT_TYPES} from "../casl/contexts";

interface RefreshTokenDecision {
    eligible: boolean;
    reason: 'offline_access_scope' | 'client_allow_refresh_token' | 'refresh_token_not_eligible';
}

@Injectable()
export class TokenClaimsService {
    constructor(
        private readonly scopeResolverService: ScopeResolverService,
        private readonly tenantService: TenantService,
        private readonly policyResolutionService: PolicyResolutionService,
        private readonly loginSessionService: LoginSessionService,
        private readonly securityEventLogger: SecurityEventLogger,
    ) {
    }

    resolveScopes(requestedScope: string | null, client: Client): string[] {
        return this.scopeResolverService.resolveScopes(
            requestedScope,
            client.allowedScopes || 'openid profile email',
        );
    }

    async fetchAndFormatRoles(permission: Permission, tenantId: string, user: User): Promise<string[]> {
        const tenantLocalRoles = await this.tenantService.getMemberRoles(permission, tenantId, user);
        const appOwnedRoles = await this.policyResolutionService.getAppOwnedRolesForUser(user.id, tenantId);
        const allRoles = [...tenantLocalRoles, ...appOwnedRoles];
        return this.formatRoleNamesForToken(allRoles);
    }

    private formatRoleNamesForToken(roles: Role[]): string[] {
        return roles.map(role => {
            if (role.app) {
                return `${role.app.name}:${role.name}`;
            }
            return role.name;
        });
    }

    buildAudience(resource: string | undefined, superTenantDomain: string): string[] {
        return resource
            ? [resource, superTenantDomain]
            : [superTenantDomain];
    }

    async resolveUserSession(
        sid: string | undefined,
        grantType: string | undefined,
        userId: string,
        tenantId: string,
        requireAuthTime?: boolean,
    ): Promise<{authTime: number; sessionId: string}> {
        if (sid) {
            const session = await this.loginSessionService.validateSession(sid);
            return {authTime: session.authTime, sessionId: session.sid};
        }
        if (grantType === GRANT_TYPES.PASSWORD || !grantType) {
            const session = await this.loginSessionService.createSession(userId, tenantId);
            return {authTime: session.authTime, sessionId: session.sid};
        }
        if (requireAuthTime) {
            throw new BadRequestException("auth_time is required but no session was provided");
        }
        return {authTime: Math.floor(Date.now() / 1000), sessionId: randomUUID()};
    }

    async resolveRefreshSession(sid: string | undefined): Promise<{authTime: number; sessionId: string}> {
        if (sid) {
            const session = await this.loginSessionService.validateSession(sid);
            return {authTime: session.authTime, sessionId: session.sid};
        }
        return {authTime: Math.floor(Date.now() / 1000), sessionId: randomUUID()};
    }

    shouldIssueRefreshToken(
        grantedScopes: string[],
        client: Client,
        grantType: string,
    ): RefreshTokenDecision {
        if (grantType === GRANT_TYPES.CLIENT_CREDENTIALS) {
            return {eligible: false, reason: 'refresh_token_not_eligible'};
        }
        if (grantedScopes.includes('offline_access')) {
            return {eligible: true, reason: 'offline_access_scope'};
        }
        if (client?.allowRefreshToken === true) {
            return {eligible: true, reason: 'client_allow_refresh_token'};
        }
        return {eligible: false, reason: 'refresh_token_not_eligible'};
    }
}

export type {RefreshTokenDecision};
