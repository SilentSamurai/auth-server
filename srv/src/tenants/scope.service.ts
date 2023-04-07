import {Injectable} from "@nestjs/common";
import {ConfigService} from "../config/config.service";
import {UsersService} from "../users/users.service";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {Tenant} from "./tenant.entity";
import {ValidationErrorException} from "../exceptions/validation-error.exception";
import {Scope} from "./scope.entity";
import {TenantService} from "./tenant.service";
import {User} from "../users/user.entity";

@Injectable()
export class ScopeService {

    constructor(
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
        private readonly tenantService: TenantService,
        @InjectRepository(Scope) private scopeRepository: Repository<Scope>,
    ) {
    }


    async create(name: string, tenant: Tenant): Promise<Scope> {
        let scope: Scope = this.scopeRepository.create({
            name: name,
            tenant: tenant
        });
        return this.scopeRepository.save(scope);
    }

    async findById(id: string) {
        let scope: Scope = await this.scopeRepository.findOne({where: {id: id}});
        if (scope === null) {
            throw new ValidationErrorException("scope not found");
        }
        return scope;
    }

    async deleteById(id: string): Promise<Scope> {
        let scope: Scope = await this.findById(id);
        return this.scopeRepository.remove(scope);
    }

    async findByNameAndTenant(name: string, tenant: Tenant): Promise<Scope> {
        let scope: Scope = await this.scopeRepository.findOne({
            where: {
                name,
                tenant: {id: tenant.id}
            }
        });
        if (scope === null) {
            throw new ValidationErrorException("scope not found");
        }
        return scope;
    }

    async deleteByName(name: string, tenant: Tenant): Promise<Scope> {
        let scope: Scope = await this.findByNameAndTenant(name, tenant);
        let isAssigned = this.usersService.isUserAssignedToScope(scope);
        if (isAssigned) {
            throw new ValidationErrorException("users are assigned to the scope")
        }
        return this.scopeRepository.remove(scope);
    }

    async getTenantScopes(tenant: Tenant): Promise<Scope[]> {
        return this.scopeRepository.find({
            where: {
                tenant: {id: tenant.id}
            }, relations: {
                tenant: true
            }
        });
    }

    async assignScopeToUser(name: string, tenant: Tenant, user: User) {
        let scope: Scope = await this.findByNameAndTenant(name, tenant);
        const isMember: boolean = await this.tenantService.isMember(tenant.id, user);
        if (!isMember) {
            throw new ValidationErrorException("user is not a member of this tenant");
        }
        return await this.usersService.addScope(user.id, scope);
    }

    async removeScopeFromUser(name: string, tenant: Tenant, user: User) {
        let scope: Scope = await this.findByNameAndTenant(name, tenant);
        const isMember: boolean = await this.tenantService.isMember(tenant.id, user);
        if (!isMember) {
            throw new ValidationErrorException("user is not a member of this tenant");
        }
        return this.usersService.removeScope(user.id, scope);
    }


}
