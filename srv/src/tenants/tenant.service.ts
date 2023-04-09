import {Injectable, OnModuleInit} from "@nestjs/common";
import {ConfigService} from "../config/config.service";
import {UsersService} from "../users/users.service";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {Tenant} from "./tenant.entity";
import {ValidationErrorException} from "../exceptions/validation-error.exception";
import {generateKeyPairSync, randomBytes, scryptSync, timingSafeEqual} from "crypto";
import {User} from "../users/user.entity";
import {Scope} from "../scopes/scope.entity";
import {ForbiddenException} from "../exceptions/forbidden.exception";
import {ScopeService} from "../scopes/scope.service";
import {ScopeEnum} from "../scopes/scope.enum";

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
    }

    async create(name: string, domain: string, owner: User): Promise<Tenant> {

        const domainTaken: Tenant = await this.tenantRepository.findOne({where: {domain}});
        if (domainTaken) {
            throw new ValidationErrorException("Domain already Taken");
        }

        const {privateKey, publicKey} = this.generateKeyPair();
        const {key, secretHash} = this.generateClientIdAndSecret();


        let tenant: Tenant = this.tenantRepository.create({
            name: name,
            domain: domain,
            privateKey: privateKey,
            publicKey: publicKey,
            clientId: key,
            clientSecret: secretHash,
            members: [owner],
            scopes: []
        });

        tenant = await this.tenantRepository.save(tenant);

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

        const {privateKey, publicKey} = this.generateKeyPair();

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

    async addMember(tenantId: string, user: User): Promise<Tenant> {
        let tenant: Tenant = await this.findById(tenantId);
        tenant.members.push(user);
        let saveTenant = await this.tenantRepository.save(tenant);
        await this.scopeService.updateUserScopes([ScopeEnum.TENANT_VIEWER], tenant, user);
        return saveTenant;
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
        if (tenant.members.find((member) => user.id === member.id) === undefined) {
            return false;
        }
        let memberScopes = await this.getMemberScope(tenantId, user);
        return memberScopes.some(scope => scope.name === ScopeEnum.TENANT_VIEWER
            || scope.name === ScopeEnum.TENANT_ADMIN);
    }

    async removeMember(tenantId: string, user: User): Promise<Tenant> {
        let tenant: Tenant = await this.findById(tenantId);
        tenant.members = tenant.members.filter((member) => member.id != user.id);
        await this.updateScopeOfMember([], tenantId, user);
        return this.tenantRepository.save(tenant)
    }

    async isMember(tenantId: string, user: User): Promise<boolean> {
        let tenant: Tenant = await this.findById(tenantId);
        return tenant.members.find((member) => user.id === member.id) !== undefined;
    }

    async isAdmin(tenantId: string, user: User): Promise<boolean> {
        let tenant: Tenant = await this.findById(tenantId);
        if (tenant.members.find((member) => user.id === member.id) === undefined) {
            return false;
        }
        let memberScopes = await this.getMemberScope(tenantId, user);
        return memberScopes.some(scope => scope.name === ScopeEnum.TENANT_ADMIN);
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
        let tenantScopes = await this.getTenantScopes(tenant);
        for (const scope of tenantScopes) {
            await this.scopeService.deleteByIdCascade(scope);
        }
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

    private generateKeyPair() {
        return generateKeyPairSync('rsa', {
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
    }

    private generateClientIdAndSecret() {
        const key = this.generateKey();
        const secretHash = this.generateSecretHash(key);
        return {key, secretHash};
    }

    private generateKey(size = 32) {
        const buffer = randomBytes(size);
        return buffer.toString("base64");
    }

    private generateSecretHash(key) {
        const salt = randomBytes(8).toString('hex');
        const buffer = scryptSync(key, salt, 64) as Buffer;
        return `${buffer.toString('hex')}.${salt}`;
    }

    private compareKeys(storedKey, suppliedKey) {
        const [hashedPassword, salt] = storedKey.split('.');

        const buffer = scryptSync(suppliedKey, salt, 64) as Buffer;
        return timingSafeEqual(Buffer.from(hashedPassword, 'hex'), buffer);
    }


    getTenantScopes(tenant: Tenant): Promise<Scope[]> {
        return this.scopeService.getTenantScopes(tenant);
    }
}
