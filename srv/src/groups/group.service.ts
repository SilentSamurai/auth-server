import {BadRequestException, Injectable} from "@nestjs/common";
import {ConfigService} from "../config/config.service";
import {UsersService} from "../users/users.service";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {Tenant} from "../tenants/tenant.entity";
import {ValidationErrorException} from "../exceptions/validation-error.exception";

import {Group} from "./group.entity";
import {GroupUser} from "./group.users.entity";
import {GroupRole} from "./group.roles.entity";
import {RoleService} from "../roles/role.service";
import {User} from "../users/user.entity";
import {Role} from "../roles/role.entity";
import {TenantService} from "../tenants/tenant.service";

@Injectable()
export class GroupService {

    constructor(
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
        private readonly roleService: RoleService,
        private readonly tenantService: TenantService,
        @InjectRepository(Group) private groupRepository: Repository<Group>,
        @InjectRepository(GroupUser) private groupUserRepository: Repository<GroupUser>,
        @InjectRepository(GroupRole) private groupRoleRepository: Repository<GroupRole>,
    ) {
    }


    async create(name: string, tenant: Tenant): Promise<Group> {
        let group: Group = this.groupRepository.create({
            name: name,
            tenant: tenant
        });
        return await this.groupRepository.save(group);
    }

    async findById(id: string): Promise<Group> {
        let group: Group = await this.groupRepository.findOne({
            where: {id: id},
            relations: ['tenant']
        });
        if (group === null) {
            throw new ValidationErrorException("group not found");
        }
        return group;
    }

    async findByTenantId(tenantId: string): Promise<Group[]> {
        return await this.groupRepository.findBy({
            tenantId: tenantId
        });
    }

    async findByNameAndTenantId(name: string, tenantId: string): Promise<Group> {
        let group: Group = await this.groupRepository.findOne({
            where: {
                name: name,
                tenantId: tenantId
            },
            relations: ['tenant']
        });
        if (group === null) {
            throw new ValidationErrorException("group not found");
        }
        return group;
    }

    async existsByNameAndTenantId(name: string, tenantId: string): Promise<boolean> {
        return await this.groupRepository.exists({
            where: {
                name: name,
                tenantId: tenantId
            },
            relations: ['tenant']
        });
    }

    async deleteById(id: string): Promise<Group> {
        let group: Group = await this.findById(id);
        let roles = await this.findGroupRoles(group);
        await this.removeRoles(group, roles.map(r => r.name));
        let users = await this.findGroupUsers(group);
        await this.removeUser(group, users.map(u => u.email));

        await this.groupRepository.remove(group);

        return group;
    }

    async isRoleInGroup(group: Group, role: Role): Promise<boolean> {
        return await this.groupRoleRepository.exists({
            where: {
                groupId: group.id,
                tenantId: group.tenantId,
                roleId: role.id
            }
        });
    }

    async findGroupRole(group: Group, role: Role): Promise<GroupRole> {
        return await this.groupRoleRepository.findOne({
            where: {
                groupId: group.id,
                tenantId: group.tenantId,
                roleId: role.id
            }
        });
    }

    async isUserInGroup(group: Group, user: User): Promise<boolean> {
        return await this.groupUserRepository.exists({
            where: {
                groupId: group.id,
                tenantId: group.tenantId,
                userId: user.id
            }
        });
    }

    async findGroupUser(group: Group, user: User): Promise<GroupUser> {
        return await this.groupUserRepository.findOne({
            where: {
                groupId: group.id,
                tenantId: group.tenantId,
                userId: user.id
            }
        });
    }

    async findGroupUsers(group: Group): Promise<User[]> {
        let groupUsers = await this.groupUserRepository.find({where: {groupId: group.id}});
        let users = await Promise.all(groupUsers.map(
            async gu => await this.usersService.findById(gu.userId)
        ));
        return users;
    }

    public async findGroupRoles(group: Group): Promise<Role[]> {
        let groupRoles = await this.groupRoleRepository.find({where: {groupId: group.id}});
        let roles = await Promise.all(groupRoles.map(
            async gr => await this.roleService.findById(gr.roleId)
        ));
        return roles;
    }


    async addRoles(group: Group, roles: string[]) {
        let oRole = [];
        let tenant = await this.tenantService.findById(group.tenantId);
        for (let role_name of roles) {
            let role = await this.roleService.findByNameAndTenant(role_name, group.tenant);
            if (!await this.isRoleInGroup(group, role)) {
                let groupRole = this.groupRoleRepository.create({
                    groupId: group.id,
                    tenantId: group.tenantId,
                    roleId: role.id
                });
                await this.groupRoleRepository.save(groupRole);
                oRole.push(role);
            }
        }
        let users = await this.findGroupUsers(group);
        for (const user of users) {
            await this.roleService.addRoles(user, group.tenant, oRole, true);
        }
    }

    async removeRoles(group: Group, roles: string[]) {
        let oRole = [];
        for (let role_name of roles) {
            let role = await this.roleService.findByNameAndTenant(role_name, group.tenant);
            if (await this.isRoleInGroup(group, role)) {
                let gr = await this.findGroupRole(group, role);
                await this.groupRoleRepository.remove(gr);
                oRole.push(role);
            }
        }
        let users = await this.findGroupUsers(group);
        for (const user of users) {
            await this.roleService.removeRoles(user, group.tenant, oRole, true);
        }
    }

    async addUser(group: Group, users: string[]) {
        let oUser = []
        for (let email of users) {
            let user = await this.usersService.findByEmail(email);
            if (!await this.isUserInGroup(group, user)) {
                let gu = this.groupUserRepository.create({
                    groupId: group.id,
                    tenantId: group.tenantId,
                    userId: user.id
                });
                gu = await this.groupUserRepository.save(gu);
                oUser.push(user);
            }
        }
        let roles = await this.findGroupRoles(group);
        for (let user of oUser) {
            await this.roleService.addRoles(user, group.tenant, roles, true);
        }
    }

    async removeUser(group: Group, users: string[]) {
        let oUser = [];
        for (let email of users) {
            let user = await this.usersService.findByEmail(email);
            if (await this.isUserInGroup(group, user)) {
                let gu = await this.findGroupUser(group, user);
                await this.groupUserRepository.remove(gu);
                oUser.push(user);
            }
        }
        let roles = await this.findGroupRoles(group);
        for (let user of oUser) {
            await this.roleService.removeRoles(user, group.tenant, roles, true);
        }
    }


    async updateGroup(group: Group, body: { name: string }) {
        if (!await this.existsByNameAndTenantId(body.name, group.tenantId)) {
            group.name = body.name;
            await this.groupRepository.save(group);
        } else {
            throw new BadRequestException("group already exists!");
        }
    }


}
