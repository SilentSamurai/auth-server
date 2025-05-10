import { RoleGuard } from '../../src/auth/role.guard';
import { Reflector } from '@nestjs/core';
import { SecurityService } from '../../src/casl/security.service';
import { RoleService } from '../../src/services/role.service';
import { TenantService } from '../../src/services/tenant.service';
import { UsersService } from '../../src/services/users.service';
import { ExecutionContext } from '@nestjs/common';

const mockReflector = () => ({
    getAllAndOverride: jest.fn(),
});
const mockSecurityService = () => ({
    isAuthenticated: jest.fn(),
    getAbility: jest.fn(),
});
const mockRoleService = () => ({});
const mockTenantService = () => ({});
const mockUsersService = () => ({});

const mockContext = (handler = {}, req: any = {}) => {
    return {
        getHandler: () => handler,
        getClass: () => ({}),
        switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext;
};

describe('RoleGuard', () => {
    let guard: RoleGuard;
    let reflector: any;
    let securityService: any;

    beforeEach(() => {
        reflector = mockReflector();
        securityService = mockSecurityService();
        guard = new RoleGuard(
            reflector as any,
            securityService as any,
            mockRoleService() as any,
            mockTenantService() as any,
            mockUsersService() as any
        );
    });

    it('should allow if no requiredRoles', async () => {
        reflector.getAllAndOverride.mockReturnValue(undefined);
        const context = mockContext();
        await expect(guard.canActivate(context)).resolves.toBe(true);
    });

    it('should deny if not authenticated', async () => {
        reflector.getAllAndOverride.mockReturnValue([{}]);
        securityService.isAuthenticated.mockReturnValue(false);
        const context = mockContext({}, {});
        await expect(guard.canActivate(context)).resolves.toBe(false);
    });

    it('should allow if ability can all required roles', async () => {
        reflector.getAllAndOverride.mockReturnValue([
            { action: 'read', subject: 'USER' },
        ]);
        securityService.isAuthenticated.mockReturnValue(true);
        securityService.getAbility.mockReturnValue({
            can: jest.fn().mockReturnValue(true),
        });
        const context = mockContext({}, {});
        await expect(guard.canActivate(context)).resolves.toBe(true);
    });

    it('should deny if ability cannot one of the required roles', async () => {
        reflector.getAllAndOverride.mockReturnValue([
            { action: 'read', subject: 'USER' },
        ]);
        securityService.isAuthenticated.mockReturnValue(true);
        securityService.getAbility.mockReturnValue({
            can: jest.fn().mockReturnValueOnce(true).mockReturnValueOnce(false),
        });
        const context = mockContext({}, {});
        await expect(guard.canActivate(context)).resolves.toBe(false);
    });
}); 