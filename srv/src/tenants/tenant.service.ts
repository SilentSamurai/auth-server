import {Injectable, OnModuleInit} from "@nestjs/common";
import {ConfigService} from "../config/config.service";
import {UsersService} from "../users/users.service";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {Tenant} from "./tenant.entity";
import {ValidationErrorException} from "../exceptions/validation-error.exception";
import {generateKeyPairSync} from "crypto";
import {User} from "../users/user.entity";
import {Scope} from "./scope.entity";
import {ForbiddenException} from "../exceptions/forbidden.exception";
import {ScopeService} from "./scope.service";

@Injectable()
export class TenantService implements OnModuleInit {

    constructor(
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
        private readonly scopeService: ScopeService,
        @InjectRepository(Tenant) private tenantRepository: Repository<Tenant>,
    ) {
    }

    async onModuleInit() {
        await this.populateGlobalTenant();
    }


    async create(name: string, domain: string, owner: User): Promise<Tenant> {

        const subdomainTaken: Tenant = await this.tenantRepository.findOne({where: {domain}});
        if (subdomainTaken) {
            throw new ValidationErrorException("Domain already Taken");
        }

        const {privateKey, publicKey} = generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });


        let tenant: Tenant = this.tenantRepository.create({
            name: name,
            domain: domain,
            privateKey: privateKey,
            publicKey: publicKey,
            members: [owner],
            scopes: []
        });

        return this.tenantRepository.save(tenant);
    }

    async updateKeys(id: string): Promise<Tenant> {
        const tenant: Tenant = await this.findById(id);
        if (!tenant) {
            throw new ValidationErrorException("tenant id not found");
        }

        const {privateKey, publicKey} = generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });

        tenant.publicKey = publicKey;
        tenant.privateKey = privateKey;

        return this.tenantRepository.save(tenant)
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

    async getAllTenants() {
        return this.tenantRepository.find();
    }


    async updateTenant(id: string, name: string, domain: string) {
        const tenant: Tenant = await this.findById(id);
        if (domain) {
            const domainTaken: Tenant = await this.findByDomain(domain);
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

    async addMember(tenantId: string, user: User): Promise<Tenant> {
        let tenant: Tenant = await this.findById(tenantId);
        tenant.members.push(user);
        return this.tenantRepository.save(tenant)
    }

    async removeMember(tenantId: string, user: User): Promise<Tenant> {
        let tenant: Tenant = await this.findById(tenantId);
        tenant.members = tenant.members.filter((member) => member.id != user.id);
        return this.tenantRepository.save(tenant)
    }

    async isMember(tenantId: string, user: User): Promise<boolean> {
        let tenant: Tenant = await this.findById(tenantId);
        return tenant.members.find((member) => user.id === member.id) !== undefined;
    }

    async addScopeToMember(name: string, tenantId: string, user: User): Promise<Scope> {
        let tenant: Tenant = await this.findById(tenantId);
        const isMember: boolean = await this.isMember(tenantId, user);
        if (!isMember) {
            throw new ValidationErrorException("user is not a member of this tenant");
        }
        return this.scopeService.assignScopeToUser(name, tenant, user)
    }

    async removeScopeFromMember(name: string, tenantId: string, user: User): Promise<Scope> {
        let tenant: Tenant = await this.findById(tenantId);
        const isMember: boolean = await this.isMember(tenantId, user);
        if (!isMember) {
            throw new ValidationErrorException("user is not a member of this tenant");
        }
        return this.scopeService.removeScopeFromUser(name, tenant, user)
    }

    async findGlobalTenant(): Promise<Tenant> {
        return this.findByDomain("auth.server.com");
    }

    async populateGlobalTenant() {
        try {
            let globalTenant = await this.tenantRepository.findOne({
                where: {domain: "auth.server.com"}, relations: {
                    members: true,
                    scopes: true
                }
            });
            if (!globalTenant) {
                const user = await this.usersService.findByEmail("admin@auth.server.com");
                const tenant: Tenant = await this.create(
                    "Global Default Tenant",
                    "auth.server.com",
                    user
                );
            }
        } catch (e) {

        }
    }
}
