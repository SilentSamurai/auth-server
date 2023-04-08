import {Injectable} from "@nestjs/common";
import {ConfigService} from "../config/config.service";
import {UsersService} from "../users/users.service";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {Tenant} from "./tenant.entity";
import {ValidationErrorException} from "../exceptions/validation-error.exception";
import {Scope} from "./scope.entity";
import {User} from "../users/user.entity";

@Injectable()
export class ScopeService {

    constructor(
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
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
        const count = await this.usersService.countByScope(scope);
        if (count > 0) {
            throw new ValidationErrorException("scope is assigned to members");
        }
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

    async getMemberScopes(tenant: Tenant, user: User): Promise<Scope[]> {
        return this.scopeRepository.find({
            where: {
                tenant: {id: tenant.id},
                users: {id: user.id}
            },
        });
    }

    async updateUserScopes(scopes: [string] | [], tenant: Tenant, user: User): Promise<Scope[]> {

        let memberScopes = await this.getMemberScopes(tenant, user);
        const previousScopeMap: Map<string, Scope> = new Map<string, Scope>();
        const currentScopeMap: Map<string, string> = new Map<string, string>();
        memberScopes.forEach(scope => previousScopeMap.set(scope.name, scope));
        scopes.forEach(name => currentScopeMap.set(name, name))

        const removeScope = [];
        const addScope = [];
        scopes.forEach(name => {
            if (!previousScopeMap.has(name)) {
                addScope.push(name);
            }
        })

        previousScopeMap.forEach((value, key, map) => {
            if (!currentScopeMap.has(key)) {
                removeScope.push(value.name);
            }
        })

        await Promise.all(addScope.map(
            async (name) => {
                let scope: Scope = await this.scopeRepository.findOne({
                    where: {
                        name,
                        tenant: {id: tenant.id}
                    },
                    relations: {
                        users: true
                    }
                });
                if (scope !== null) {
                    scope.users.push(user);
                    return this.scopeRepository.save(scope);
                }
                return null;
            }
        ));

        await Promise.all(removeScope.map(
            async (name) => {
                let scope: Scope = await this.scopeRepository.findOne({
                    where: {
                        name,
                        tenant: {id: tenant.id}
                    },
                    relations: {
                        users: true
                    }
                });
                if (scope !== null) {
                    scope.users = scope.users.filter(scopeUser => scopeUser.id != user.id);
                    return this.scopeRepository.save(scope);
                }
                return null;
            }
        ))


        return this.getMemberScopes(tenant, user);
    }


}
