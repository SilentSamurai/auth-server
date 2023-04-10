import {Injectable} from "@nestjs/common";
import {ConfigService} from "../config/config.service";
import {UsersService} from "../users/users.service";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {Tenant} from "../tenants/tenant.entity";
import {ValidationErrorException} from "../exceptions/validation-error.exception";
import {Scope} from "./scope.entity";
import {User} from "../users/user.entity";
import {UserScope} from "./user.scopes.entity";

@Injectable()
export class ScopeService {

    constructor(
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
        @InjectRepository(Scope) private scopeRepository: Repository<Scope>,
        @InjectRepository(UserScope) private userScopeRepository: Repository<UserScope>,
    ) {
    }


    async create(name: string, tenant: Tenant, removable: boolean = true): Promise<Scope> {
        let scope: Scope = this.scopeRepository.create({
            name: name,
            tenant: tenant,
            removable: removable
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

    async deleteByTenant(tenant: Tenant): Promise<number> {
        let deleteResult = await this.userScopeRepository.delete({
            tenantId: tenant.id
        });
        let deleteResult1 = await this.scopeRepository.delete({
            tenant: {
                id: tenant.id
            }
        });
        return deleteResult1.affected;
    }

    async deleteById(id: string): Promise<Scope> {
        let scope: Scope = await this.findById(id);
        const count = await this.usersService.countByScope(scope);
        if (count > 0 || !scope.removable) {
            throw new ValidationErrorException("scope is assigned to members | scope is protected");
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

    async getTenantScopes(tenant: Tenant): Promise<Scope[]> {
        return this.scopeRepository.find({
            where: {
                tenant: {id: tenant.id}
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

    async hasAllScopes(scopes: string[], tenant: Tenant, user: User): Promise<boolean> {
        for (let name of scopes) {
            let scope = await this.findByNameAndTenant(name, tenant);
            const hasScope = await this.userScopeRepository.exist({
                where: {
                    tenantId: tenant.id,
                    userId: user.id,
                    scopeId: scope.id
                },
            })
            if (!hasScope) return false;
        }
        return true;
    }

    async hasAnyOfScopes(scopes: string[], tenant: Tenant, user: User): Promise<boolean> {
        for (let name of scopes) {
            let scope = await this.findByNameAndTenant(name, tenant);
            const hasScope = await this.userScopeRepository.exist({
                where: {
                    tenantId: tenant.id,
                    userId: user.id,
                    scopeId: scope.id
                },
            })
            if (hasScope) return true;
        }
        return false;
    }

    async updateUserScopes(scopes: string[], tenant: Tenant, user: User): Promise<Scope[]> {

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
                    let userScope = this.userScopeRepository.create({
                        userId: user.id,
                        tenantId: tenant.id,
                        scopeId: scope.id
                    });
                    await this.userScopeRepository.save(userScope);
                }
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
                    let userScope = await this.userScopeRepository.findOne({
                        where: {
                            tenantId: tenant.id,
                            userId: user.id,
                            scopeId: scope.id
                        }
                    });
                    await this.userScopeRepository.remove(userScope);
                }
            }
        ))


        return this.getMemberScopes(tenant, user);
    }


}
