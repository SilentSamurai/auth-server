import {Injectable} from "@nestjs/common";
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

@Injectable()
export class GroupService {

    constructor(
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
        private readonly roleService: RoleService,
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
        let group: Group = await this.groupRepository.findOne({where: {id: id}});
        if (group === null) {
            throw new ValidationErrorException("group not found");
        }
        return group;
    }

    async deleteById(id: string): Promise<Group> {
        let group: Group = await this.findById(id);
        // implement
        return null;
    }

    async isRoleInGroup(group: Group, role: Role): Promise<boolean> {
        return await this.groupRoleRepository.exists({
            where: {
                group: group,
                tenant: group.tenant,
                role: role
            }
        });
    }

    async findGroupRole(group: Group, role: Role): Promise<GroupRole> {
        return await this.groupRoleRepository.findOne({
            where: {
                group: group,
                tenant: group.tenant,
                role: role
            }
        });
    }

    async isUserInGroup(group: Group, user: User): Promise<boolean> {
        return await this.groupUserRepository.exists({
            where: {
                group: group,
                tenant: group.tenant,
                user: user
            }
        });
    }

    async findGroupUser(group: Group, user: User): Promise<GroupUser> {
        return await this.groupUserRepository.findOne({
            where: {
                group: group,
                tenant: group.tenant,
                user: user
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

    async addRoles(group: Group, roles: string[]) {
        let oRole = [];
        for (let role_name of roles) {
            let role = await this.roleService.findById(role_name);
            if (!await this.isRoleInGroup(group, role)) {
                let groupRole = this.groupRoleRepository.create({
                    group: group,
                    tenant: group.tenant,
                    role: role
                });
                await this.groupRoleRepository.save(groupRole);
                oRole.push(role);
            }
        }
        let users = await this.findGroupUsers(group);
        for (const user of users) {
            await this.roleService.addRoles(user, group.tenant, oRole);
        }
    }

    async removeRoles(group: Group, roles: string[]) {
        let oRole = [];
        for (let role_name of roles) {
            let role = await this.roleService.findById(role_name);
            if (await this.isRoleInGroup(group, role)) {
                let gr = await this.findGroupRole(group, role);
                await this.groupRoleRepository.remove(gr);
                oRole.push(role);
            }
        }
        let users = await this.findGroupUsers(group);
        for (const user of users) {
            await this.roleService.addRoles(user, group.tenant, oRole);
        }
    }

    async addUser(group: Group, users: string[]) {
        let oUser = []
        for (let email of users) {
            let user = await this.usersService.findByEmail(email);
            if (!await this.isUserInGroup(group, user)) {
                let gu = this.groupUserRepository.create({
                    group: group,
                    tenant: group.tenant,
                    user: user
                });
                gu = await this.groupUserRepository.save(gu);
                oUser.push(user);
            }
        }
        let roles = await this.findGroupRoles(group);
        for (let user of oUser) {
            await this.roleService.addRoles(user, group.tenant, roles);
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
            await this.roleService.addRoles(user, group.tenant, roles);
        }
    }

    private async findGroupRoles(group: Group) {
        let groupRoles = await this.groupRoleRepository.find({where: {groupId: group.id}});
        let roles = await Promise.all(groupRoles.map(
            async gr => await this.roleService.findById(gr.roleId)
        ));
        return roles;
    }


}
