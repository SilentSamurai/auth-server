import {Injectable} from "@nestjs/common";
import {ConfigService} from "../config/config.service";
import {UsersService} from "../users/users.service";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {Tenant} from "./tenant.entity";
import {ValidationErrorException} from "../exceptions/validation-error.exception";
import {generateKeyPairSync} from "crypto";
import {User} from "../users/user.entity";

@Injectable()
export class TenantService {

    constructor(
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
        @InjectRepository(Tenant) private tenantRepository: Repository<Tenant>,
    ) {
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

    async findByDomain(domain: string) {
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
}
