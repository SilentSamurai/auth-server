import {Injectable, OnModuleInit} from "@nestjs/common";
import {ConfigService} from "../config/config.service";
import {UsersService} from "./users.service";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {Tenant} from "../entity/tenant.entity";
import {ValidationErrorException} from "../exceptions/validation-error.exception";
import {User} from "../entity/user.entity";
import {Role} from "../entity/role.entity";
import {ForbiddenException} from "../exceptions/forbidden.exception";
import {RoleService} from "./role.service";
import {RoleEnum} from "../entity/roleEnum";
import {CryptUtil} from "../util/crypt.util";
import {TenantMember} from "../entity/tenant.members.entity";
import {NotFoundException} from "../exceptions/not-found.exception";
import {AuthContext} from "../casl/contexts";
import {SecurityService} from "../casl/security.service";
import {Action} from "../casl/actions.enum";
import {SubjectEnum} from "../entity/subjectEnum";

@Injectable()
export class TenantService implements OnModuleInit {

    constructor(
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
        private readonly roleService: RoleService,
        private readonly securityService: SecurityService,
        @InjectRepository(Tenant) private tenantRepository: Repository<Tenant>,
        @InjectRepository(TenantMember) private tenantMemberRepository: Repository<TenantMember>,
    ) {
    }

    async onModuleInit() {
    }

    async create(authContext: AuthContext, name: string, domain: string, owner: User): Promise<Tenant> {

        this.securityService.isAuthorized(authContext, Action.Create, SubjectEnum.TENANT)

        const domainTaken: Tenant = await this.tenantRepository.findOne({where: {domain}});
        if (domainTaken) {
            throw new ValidationErrorException("Domain already Taken");
        }

        const {privateKey, publicKey} = CryptUtil.generateKeyPair();
        const {clientId, clientSecret, salt} = CryptUtil.generateClientIdAndSecret();


        let tenant: Tenant = this.tenantRepository.create({
            name: name,
            domain: domain,
            privateKey: privateKey,
            publicKey: publicKey,
            clientId: clientId,
            clientSecret: clientSecret,
            secretSalt: salt,
            members: [],
            roles: []
        });

        tenant = await this.tenantRepository.save(tenant);

        await this.addMember(authContext, tenant.id, owner);

        let adminRole = await this.roleService.create(authContext, RoleEnum.TENANT_ADMIN, tenant, false);
        let viewerRole = await this.roleService.create(authContext, RoleEnum.TENANT_VIEWER, tenant, false);

        await this.tenantRepository.createQueryBuilder()
            .relation(Tenant, "roles")
            .of(tenant.id)
            .add([adminRole.id, viewerRole.id]);

        await this.updateRolesOfMember(authContext, [adminRole.name], tenant.id, owner);

        return tenant;
    }

    async updateKeys(authContext: AuthContext, id: string): Promise<Tenant> {

        this.securityService.isAuthorized(authContext, Action.Update, SubjectEnum.TENANT, {id: id});

        const tenant: Tenant = await this.findById(authContext, id);
        if (!tenant) {
            throw new NotFoundException("tenant id not found");
        }

        const {privateKey, publicKey} = CryptUtil.generateKeyPair();

        tenant.publicKey = publicKey;
        tenant.privateKey = privateKey;

        return this.tenantRepository.save(tenant)
    }

    async existByDomain(authContext: AuthContext, domain: string): Promise<boolean> {

        this.securityService.isAuthorized(authContext, Action.Read, SubjectEnum.TENANT);

        return this.tenantRepository.exist({
            where: {domain}
        });
    }

    async findById(authContext: AuthContext, id: string) {

        this.securityService.isAuthorized(authContext, Action.Read, SubjectEnum.TENANT, {id: id});

        let tenant = await this.tenantRepository.findOne({
            where: {id: id}, relations: {
                members: true,
                roles: true
            }
        });
        if (tenant === null) {
            throw new NotFoundException("tenant not found");
        }
        return tenant;
    }

    async findByDomain(authContext: AuthContext, domain: string): Promise<Tenant> {

        this.securityService.isAuthorized(authContext, Action.Read, SubjectEnum.TENANT, {domain: domain});

        let tenant = await this.tenantRepository.findOne({
            where: {domain}, relations: {
                members: true,
                roles: true
            }
        });
        if (tenant === null) {
            throw new NotFoundException("tenant not found");
        }
        return tenant;
    }

    async findByClientId(authContext: AuthContext, clientId: string): Promise<Tenant> {

        this.securityService.isAuthorized(authContext, Action.Read, SubjectEnum.TENANT, {clientId: clientId});

        let tenant = await this.tenantRepository.findOne({
            where: {clientId}, relations: {
                members: true,
                roles: true
            }
        });
        if (tenant === null) {
            throw new NotFoundException("tenant not found");
        }
        return tenant;
    }

    async addMember(authContext: AuthContext, tenantId: string, user: User): Promise<TenantMember> {

        this.securityService.isAuthorized(authContext, Action.Update, SubjectEnum.TENANT, {id: tenantId});

        let tenant: Tenant = await this.findById(authContext, tenantId);
        let tenantMember = this.tenantMemberRepository.create({
            tenantId: tenant.id,
            userId: user.id
        });
        // await this.roleService.updateUserScopes([ScopeEnum.TENANT_VIEWER], tenant, user);
        return this.tenantMemberRepository.save(tenantMember);
    }

    async getAllTenants(authContext: AuthContext) {

        this.securityService.isAuthorized(authContext, Action.Update, SubjectEnum.TENANT);

        return this.tenantRepository.find();
    }

    async updateTenant(authContext: AuthContext, id: string, name: string, domain: string) {

        this.securityService.isAuthorized(authContext, Action.Update, SubjectEnum.TENANT);

        const tenant: Tenant = await this.findById(authContext, id);
        if (domain) {
            const domainTaken: Tenant = await this.tenantRepository.findOne({where: {domain}});
            if (domainTaken) {
                throw new ValidationErrorException("domain is already taken");
            }
            tenant.domain = domain || tenant.domain;
        }
        tenant.name = name || tenant.name;
        return this.tenantRepository.save(tenant)
    }

    async getMemberRoles(authContext: AuthContext, tenantId: string, user: User): Promise<Role[]> {

        this.securityService.isAuthorized(authContext, Action.Read, SubjectEnum.TENANT, {id: tenantId});

        let tenant: Tenant = await this.findById(authContext, tenantId);
        let isMember = await this.isMember(authContext, tenant.id, user);
        if (!isMember) {
            throw new ForbiddenException("Not a Member.");
        }
        return this.roleService.getMemberRoles(authContext, tenant, user);
    }

    async isViewer(authContext: AuthContext, tenantId: string, user: User): Promise<boolean> {

        this.securityService.isAuthorized(authContext, Action.Read, SubjectEnum.TENANT, {id: tenantId});

        let tenant: Tenant = await this.findById(authContext, tenantId);
        if (!(await this.isMember(authContext, tenantId, user))) {
            return false;
        }
        return this.roleService.hasAnyOfRoles(authContext, [RoleEnum.TENANT_ADMIN, RoleEnum.TENANT_VIEWER],
            tenant, user);
    }

    async removeMember(authContext: AuthContext, tenantId: string, user: User): Promise<Tenant> {

        this.securityService.isAuthorized(authContext, Action.Update, SubjectEnum.TENANT, {id: tenantId});

        let tenant: Tenant = await this.findById(authContext, tenantId);
        let tenantMember = await this.findMembership(authContext, tenant, user);
        await this.updateRolesOfMember(authContext, [], tenantId, user);
        await this.tenantMemberRepository.remove(tenantMember);
        return tenant;
    }

    async isMember(authContext: AuthContext, tenantId: string, user: User): Promise<boolean> {

        this.securityService.isAuthorized(authContext, Action.Read, SubjectEnum.TENANT, {id: tenantId});

        return this.tenantMemberRepository.exists({
            where: {
                tenantId: tenantId,
                userId: user.id
            }
        });
    }

    async findMembership(authContext: AuthContext, tenant: Tenant, user: User): Promise<TenantMember> {

        this.securityService.isAuthorized(authContext, Action.Read, SubjectEnum.TENANT, {id: tenant.id});

        let tenantMember = await this.tenantMemberRepository.findOne({
            where: {
                tenantId: tenant.id,
                userId: user.id
            }
        });
        if (tenantMember === null) {
            throw new NotFoundException("user is not a member of this tenant");
        }
        return tenantMember;
    }

    async isAdmin(authContext: AuthContext, tenantId: string, user: User): Promise<boolean> {

        this.securityService.isAuthorized(authContext, Action.Read, SubjectEnum.TENANT, {id: tenantId});

        let tenant: Tenant = await this.findById(authContext, tenantId);
        if (!(await this.isMember(authContext, tenantId, user))) {
            return false;
        }
        return this.roleService.hasAllRoles(authContext, [RoleEnum.TENANT_ADMIN], tenant, user);
    }

    async findGlobalTenant(authContext: AuthContext): Promise<Tenant> {
        return this.findByDomain(authContext, this.configService.get("SUPER_TENANT_DOMAIN"));
    }

    async updateRolesOfMember(authContext: AuthContext, roles: string[], tenantId: string, user: User): Promise<Role[]> {

        this.securityService.isAuthorized(authContext, Action.Update, SubjectEnum.TENANT, {id: tenantId});

        let tenant: Tenant = await this.findById(authContext, tenantId);
        const isMember: boolean = await this.isMember(authContext, tenantId, user);
        if (!isMember) {
            throw new NotFoundException("user is not a member of this tenant");
        }
        return this.roleService.updateUserRoles(authContext, roles, tenant, user)
    }

    async findByMembership(authContext: AuthContext, user: User): Promise<Tenant[]> {

        this.securityService.isAuthorized(authContext, Action.Read, SubjectEnum.TENANT);

        const tenants: Tenant[] = await this.tenantRepository.find({
            where: {
                members: {id: user.id}
            }, relations: {
                roles: true
            }
        });
        return tenants;
    }

    async findByViewership(authContext: AuthContext, user: User): Promise<Tenant[]> {

        this.securityService.isAuthorized(authContext, Action.Read, SubjectEnum.TENANT);

        const tenants: Tenant[] = await this.tenantRepository.find({
            where: {
                members: {id: user.id}
            }, relations: {
                roles: true
            }
        });
        return tenants.filter(tenant => this.isViewer(authContext, tenant.id, user));
    }

    async deleteTenant(authContext: AuthContext, tenantId: string) {

        this.securityService.isAuthorized(authContext, Action.Delete, SubjectEnum.TENANT, {id: tenantId});

        let tenant: Tenant = await this.findById(authContext, tenantId);
        await this.roleService.deleteByTenant(authContext, tenant);
        return this.tenantRepository.remove(tenant);
    }

    async deleteTenantSecure(authContext: AuthContext, tenantId: string) {

        this.securityService.isAuthorized(authContext, Action.Delete, SubjectEnum.TENANT, {id: tenantId});

        let tenant: Tenant = await this.findById(authContext, tenantId);
        let count = await this.usersService.countByTenant(authContext, tenant);
        if (count > 0) {
            throw new ValidationErrorException("tenant contains members");
        }
        return this.tenantRepository.remove(tenant);
    }

    async getTenantRoles(authContext: AuthContext, tenant: Tenant): Promise<Role[]> {

        this.securityService.isAuthorized(authContext, Action.Delete, SubjectEnum.TENANT, {id: tenant.id});

        return this.roleService.getTenantRoles(authContext, tenant);
    }


}
