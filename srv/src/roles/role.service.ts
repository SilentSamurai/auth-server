import {Injectable} from "@nestjs/common";
import {ConfigService} from "../config/config.service";
import {UsersService} from "../users/users.service";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {Tenant} from "../tenants/tenant.entity";
import {ValidationErrorException} from "../exceptions/validation-error.exception";
import {Role} from "./role.entity";
import {User} from "../users/user.entity";
import {UserRole} from "./user.roles.entity";

@Injectable()
export class RoleService {

    constructor(
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
        @InjectRepository(Role) private roleRepository: Repository<Role>,
        @InjectRepository(UserRole) private userRoleRepository: Repository<UserRole>,
    ) {
    }


    async create(name: string, tenant: Tenant, removable: boolean = true): Promise<Role> {
        let role: Role = this.roleRepository.create({
            name: name,
            tenant: tenant,
            removable: removable
        });
        return this.roleRepository.save(role);
    }

    async findById(id: string) {
        let role: Role = await this.roleRepository.findOne({where: {id: id}});
        if (role === null) {
            throw new ValidationErrorException("role not found");
        }
        return role;
    }

    async deleteByTenant(tenant: Tenant): Promise<number> {
        let deleteResult = await this.userRoleRepository.delete({
            tenantId: tenant.id
        });
        let deleteResult1 = await this.roleRepository.delete({
            tenant: {
                id: tenant.id
            }
        });
        return deleteResult1.affected;
    }

    async deleteById(id: string): Promise<Role> {
        let role: Role = await this.findById(id);
        const count = await this.usersService.countByRole(role);
        if (count > 0 || !role.removable) {
            throw new ValidationErrorException("role is assigned to members | role is protected");
        }
        return this.roleRepository.remove(role);
    }

    async findByNameAndTenant(name: string, tenant: Tenant): Promise<Role> {
        let role: Role = await this.roleRepository.findOne({
            where: {
                name,
                tenant: {id: tenant.id}
            },
            relations: {
                tenant: true
            }
        });
        if (role === null) {
            throw new ValidationErrorException("role not found");
        }
        return role;
    }

    async getTenantRoles(tenant: Tenant): Promise<Role[]> {
        return this.roleRepository.find({
            where: {
                tenant: {id: tenant.id}
            }
        });
    }

    async getMemberRoles(tenant: Tenant, user: User): Promise<Role[]> {
        return this.roleRepository.find({
            where: {
                tenant: {id: tenant.id},
                users: {id: user.id}
            },
        });
    }

    async hasAllRoles(roles: string[], tenant: Tenant, user: User): Promise<boolean> {
        for (let name of roles) {
            let role = await this.findByNameAndTenant(name, tenant);
            const hasRole = await this.userRoleRepository.exist({
                where: {
                    tenantId: tenant.id,
                    userId: user.id,
                    roleId: role.id
                },
            })
            if (!hasRole) return false;
        }
        return true;
    }

    async hasAnyOfRoles(roles: string[], tenant: Tenant, user: User): Promise<boolean> {
        for (let name of roles) {
            let role = await this.findByNameAndTenant(name, tenant);
            const hasRole = await this.userRoleRepository.exist({
                where: {
                    tenantId: tenant.id,
                    userId: user.id,
                    roleId: role.id
                },
            })
            if (hasRole) return true;
        }
        return false;
    }

    async updateUserRoles(roles: string[], tenant: Tenant, user: User): Promise<Role[]> {

        let memberRoles = await this.getMemberRoles(tenant, user);
        const previousRoleMap: Map<string, Role> = new Map<string, Role>();
        const currentRoleMap: Map<string, string> = new Map<string, string>();
        memberRoles.forEach(role => previousRoleMap.set(role.name, role));
        roles.forEach(name => currentRoleMap.set(name, name))

        const removeRoles = [];
        const addRoles = [];
        roles.forEach(name => {
            if (!previousRoleMap.has(name)) {
                addRoles.push(name);
            }
        })

        previousRoleMap.forEach((value, key, map) => {
            if (!currentRoleMap.has(key)) {
                removeRoles.push(value.name);
            }
        });

        await this.addRoles(user, tenant, addRoles);
        await this.removeRoles(user, tenant, removeRoles);

        return this.getMemberRoles(tenant, user);
    }

    async removeRoles(user: User, tenant: Tenant, roles: string[] | Role[], from_group = false) {
        return await Promise.all(roles.map(
            async (role: string | Role) => {
                if(typeof role == 'string') {
                    let name = role as string;
                    role = await this.roleRepository.findOne({
                        where: {
                            name,
                            tenant: {id: tenant.id}
                        },
                        relations: {
                            users: true
                        }
                    });
                }
                if (role !== null) {
                    let userRole = await this.userRoleRepository.findOne({
                        where: {
                            tenantId: tenant.id,
                            userId: user.id,
                            roleId: role.id,
                            from_group: from_group
                        }
                    });
                    await this.userRoleRepository.remove(userRole);
                }
            }
        ))
    }

    async addRoles(user: User, tenant: Tenant, roles: string[] | Role[], from_group = false) {
        return await Promise.all(roles.map(
            async (role: string | Role) => {
                if (typeof role == 'string') {
                    let name = role as string;
                    role = await this.roleRepository.findOne({
                        where: {
                            name,
                            tenant: {id: tenant.id}
                        },
                        relations: {
                            users: true
                        }
                    });
                }
                if (role !== null) {
                    let userRole = this.userRoleRepository.create({
                        userId: user.id,
                        tenantId: tenant.id,
                        roleId: role.id,
                        from_group: from_group
                    });
                    await this.userRoleRepository.save(userRole);
                }
            }
        ));
    }
}
