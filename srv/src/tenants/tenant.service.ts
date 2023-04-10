import {Injectable, OnModuleInit} from "@nestjs/common";
import {ConfigService} from "../config/config.service";
import {UsersService} from "../users/users.service";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {Tenant} from "./tenant.entity";
import {ValidationErrorException} from "../exceptions/validation-error.exception";
import {User} from "../users/user.entity";
import {Scope} from "../scopes/scope.entity";
import {ForbiddenException} from "../exceptions/forbidden.exception";
import {ScopeService} from "../scopes/scope.service";
import {ScopeEnum} from "../scopes/scope.enum";
import {CryptUtil} from "../util/crypt.util";
import {TenantMember} from "./tenant.members.entity";

@Injectable()
export class TenantService implements OnModuleInit {

    constructor(
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
        private readonly scopeService: ScopeService,
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
        const {clientId, clientSecret} = CryptUtil.generateClientIdAndSecret();


        let tenant: Tenant = this.tenantRepository.create({
            name: name,
            domain: domain,
            privateKey: privateKey,
            publicKey: publicKey,
            clientId: clientId,
            clientSecret: clientSecret,
            members: [],
            scopes: []
        });

        tenant = await this.tenantRepository.save(tenant);

        await this.addMember(tenant.id, owner);

        let adminScope = await this.scopeService.create(ScopeEnum.TENANT_ADMIN, tenant, false);
        let viewerScope = await this.scopeService.create(ScopeEnum.TENANT_VIEWER, tenant, false);

        await this.tenantRepository.createQueryBuilder()
            .relation(Tenant, "scopes")
            .of(tenant.id)
            .add([adminScope.id, viewerScope.id]);

        await this.updateScopeOfMember([adminScope.name], tenant.id, owner);

        return tenant;
    }

    async updateKeys(id: string): Promise<Tenant> {
        const tenant: Tenant = await this.findById(id);
        if (!tenant) {
            throw new ValidationErrorException("tenant id not found");
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
                scopes: true
            }
        });
        if (tenant === null) {
            throw new ValidationErrorException("tenant not found");
        }
        return tenant;
    }

    async findByDomain(domain: string): Promise<Tenant> {
        let tenant = await this.tenantRepository.findOne({
            where: {domain}, relations: {
                members: true,
                scopes: true
            }
        });
        if (tenant === null) {
            throw new ValidationErrorException("tenant not found");
        }
        return tenant;
    }

    async findByClientId(clientId: string): Promise<Tenant> {
        let tenant = await this.tenantRepository.findOne({
            where: {clientId}, relations: {
                members: true,
                scopes: true
            }
        });
        if (tenant === null) {
            throw new ValidationErrorException("tenant not found");
        }
        return tenant;
    }

    async addMember(tenantId: string, user: User): Promise<TenantMember> {
        let tenant: Tenant = await this.findById(tenantId);
        let tenantMember = this.tenantMemberRepository.create({
            tenantId: tenant.id,
            userId: user.id
        });
        // await this.scopeService.updateUserScopes([ScopeEnum.TENANT_VIEWER], tenant, user);
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

    async getMemberScope(tenantId: string, user: User): Promise<Scope[]> {
        let tenant: Tenant = await this.findById(tenantId);
        let isMember = await this.isMember(tenant.id, user);
        if (!isMember) {
            throw new ForbiddenException("Not a Member.");
        }
        return this.scopeService.getMemberScopes(tenant, user);
    }

    async isViewer(tenantId: string, user: User): Promise<boolean> {
        let tenant: Tenant = await this.findById(tenantId);
        if (!(await this.isMember(tenantId, user))) {
            return false;
        }
        return this.scopeService.hasAnyOfScopes([ScopeEnum.TENANT_ADMIN, ScopeEnum.TENANT_VIEWER],
            tenant, user);
    }

    async removeMember(tenantId: string, user: User): Promise<Tenant> {
        let tenant: Tenant = await this.findById(tenantId);
        let tenantMember = await this.findMembership(tenant, user);
        await this.updateScopeOfMember([], tenantId, user);
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
            throw new ValidationErrorException("user is not a member of this tenant");
        }
        return tenantMember;
    }

    async isAdmin(tenantId: string, user: User): Promise<boolean> {
        let tenant: Tenant = await this.findById(tenantId);
        if (!(await this.isMember(tenantId, user))) {
            return false;
        }
        return this.scopeService.hasAllScopes([ScopeEnum.TENANT_ADMIN], tenant, user);
    }

    async findGlobalTenant(): Promise<Tenant> {
        return this.findByDomain(this.configService.get("SUPER_TENANT_DOMAIN"));
    }

    async updateScopeOfMember(scopes: string[], tenantId: string, user: User): Promise<Scope[]> {
        let tenant: Tenant = await this.findById(tenantId);
        const isMember: boolean = await this.isMember(tenantId, user);
        if (!isMember) {
            throw new ValidationErrorException("user is not a member of this tenant");
        }
        return this.scopeService.updateUserScopes(scopes, tenant, user)
    }

    async findByMembership(user: User) {
        const tenants: Tenant[] = await this.tenantRepository.find({
            where: {
                members: {id: user.id}
            }, relations: {
                scopes: true
            }
        });
        return tenants;
    }

    async deleteTenant(tenantId: string) {
        let tenant: Tenant = await this.findById(tenantId);
        await this.scopeService.deleteByTenant(tenant);
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

    getTenantScopes(tenant: Tenant): Promise<Scope[]> {
        return this.scopeService.getTenantScopes(tenant);
    }


}
