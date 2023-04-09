import {Injectable} from "@nestjs/common";
import {ConfigService} from "../config/config.service";
import {UsersService} from "../users/users.service";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {Tenant} from "../tenants/tenant.entity";
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

    async deleteByIdCascade(scope: Scope): Promise<Scope> {
        return this.scopeRepository.remove(scope);
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
                    await this.scopeRepository.createQueryBuilder()
                        .relation(Scope, "users")
                        .of(scope.id)
                        .add(user.id);
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
                    await this.scopeRepository.createQueryBuilder()
                        .relation(Scope, "users")
                        .of(scope.id)
                        .remove(user.id);
                }
            }
        ))


        return this.getMemberScopes(tenant, user);
    }


}
