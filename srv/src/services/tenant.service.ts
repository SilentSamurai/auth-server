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

@Injectable()
export class TenantService implements OnModuleInit {

    constructor(
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
        private readonly roleService: RoleService,
        @InjectRepository(Tenant) private tenantRepository: Repository<Tenant>,
        @InjectRepository(TenantMember) private tenantMemberRepository: Repository<TenantMember>,
    ) {
    }

    async onModuleInit() {
    }

    async create(name: string, domain: string, owner: User): Promise<Tenant> {

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

        await this.addMember(tenant.id, owner);

        let adminRole = await this.roleService.create(RoleEnum.TENANT_ADMIN, tenant, false);
        let viewerRole = await this.roleService.create(RoleEnum.TENANT_VIEWER, tenant, false);

        await this.tenantRepository.createQueryBuilder()
            .relation(Tenant, "roles")
            .of(tenant.id)
            .add([adminRole.id, viewerRole.id]);

        await this.updateRolesOfMember([adminRole.name], tenant.id, owner);

        return tenant;
    }

    async updateKeys(id: string): Promise<Tenant> {
        const tenant: Tenant = await this.findById(id);
        if (!tenant) {
            throw new NotFoundException("tenant id not found");
        }

        const {privateKey, publicKey} = CryptUtil.generateKeyPair();

        tenant.publicKey = publicKey;
        tenant.privateKey = privateKey;

        return this.tenantRepository.save(tenant)
    }

    async existByDomain(domain: string): Promise<boolean> {
        return this.tenantRepository.exist({
            where: {domain}
        });
    }

    async findById(id: string) {
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

    async findByDomain(domain: string): Promise<Tenant> {
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

    async findByClientId(clientId: string): Promise<Tenant> {
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

    async addMember(tenantId: string, user: User): Promise<TenantMember> {
        let tenant: Tenant = await this.findById(tenantId);
        let tenantMember = this.tenantMemberRepository.create({
            tenantId: tenant.id,
            userId: user.id
        });
        // await this.roleService.updateUserScopes([ScopeEnum.TENANT_VIEWER], tenant, user);
        return this.tenantMemberRepository.save(tenantMember);
    }

    async getAllTenants() {
        return this.tenantRepository.find();
    }

    async updateTenant(id: string, name: string, domain: string) {
        const tenant: Tenant = await this.findById(id);
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

    async getMemberRoles(tenantId: string, user: User): Promise<Role[]> {
        let tenant: Tenant = await this.findById(tenantId);
        let isMember = await this.isMember(tenant.id, user);
        if (!isMember) {
            throw new ForbiddenException("Not a Member.");
        }
        return this.roleService.getMemberRoles(tenant, user);
    }

    async isViewer(tenantId: string, user: User): Promise<boolean> {
        let tenant: Tenant = await this.findById(tenantId);
        if (!(await this.isMember(tenantId, user))) {
            return false;
        }
        return this.roleService.hasAnyOfRoles([RoleEnum.TENANT_ADMIN, RoleEnum.TENANT_VIEWER],
            tenant, user);
    }

    async removeMember(tenantId: string, user: User): Promise<Tenant> {
        let tenant: Tenant = await this.findById(tenantId);
        let tenantMember = await this.findMembership(tenant, user);
        await this.updateRolesOfMember([], tenantId, user);
        await this.tenantMemberRepository.remove(tenantMember);
        return tenant;
    }

    async isMember(tenantId: string, user: User): Promise<boolean> {
        return this.tenantMemberRepository.exist({
            where: {
                tenantId: tenantId,
                userId: user.id
            }
        });
    }

    async findMembership(tenant: Tenant, user: User): Promise<TenantMember> {
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

    async isAdmin(tenantId: string, user: User): Promise<boolean> {
        let tenant: Tenant = await this.findById(tenantId);
        if (!(await this.isMember(tenantId, user))) {
            return false;
        }
        return this.roleService.hasAllRoles([RoleEnum.TENANT_ADMIN], tenant, user);
    }

    async findGlobalTenant(): Promise<Tenant> {
        return this.findByDomain(this.configService.get("SUPER_TENANT_DOMAIN"));
    }

    async updateRolesOfMember(roles: string[], tenantId: string, user: User): Promise<Role[]> {
        let tenant: Tenant = await this.findById(tenantId);
        const isMember: boolean = await this.isMember(tenantId, user);
        if (!isMember) {
            throw new NotFoundException("user is not a member of this tenant");
        }
        return this.roleService.updateUserRoles(roles, tenant, user)
    }

    async findByMembership(user: User): Promise<Tenant[]> {
        const tenants: Tenant[] = await this.tenantRepository.find({
            where: {
                members: {id: user.id}
            }, relations: {
                roles: true
            }
        });
        return tenants;
    }

    async findByViewership(user: User): Promise<Tenant[]> {
        const tenants: Tenant[] = await this.tenantRepository.find({
            where: {
                members: {id: user.id}
            }, relations: {
                roles: true
            }
        });
        return tenants.filter(tenant => this.isViewer(tenant.id, user));
    }

    async deleteTenant(tenantId: string) {
        let tenant: Tenant = await this.findById(tenantId);
        await this.roleService.deleteByTenant(tenant);
        return this.tenantRepository.remove(tenant);
    }

    async deleteTenantSecure(tenantId: string) {
        let tenant: Tenant = await this.findById(tenantId);
        let count = await this.usersService.countByTenant(tenant);
        if (count > 0) {
            throw new ValidationErrorException("tenant contains members");
        }
        return this.tenantRepository.remove(tenant);
    }

    async getTenantRoles(tenant: Tenant): Promise<Role[]> {
        return this.roleService.getTenantRoles(tenant);
    }


}
