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

    async findGroupUsers(group: Group): Promise<User[]> {
        let groupUsers = await this.groupUserRepository.find({where: {groupId: group.id}});
        let users = await Promise.all(groupUsers.map(async gu => await this.usersService.findById(gu.userId)));
        return users;
    }


    async addRoles(group: Group, roles: string[]) {
        for (let role_name of roles) {
            let role = await this.roleService.findById(role_name);
            this.groupRoleRepository.create({
                group: group,
                tenant: group.tenant,
                role: role
            });
        }

        let users = await this.findGroupUsers(group);

        for (const user of users) {
            await this.roleService.addRoles(user, group.tenant, roles);
        }
    }

    async removeRoles(group: Group, roles: string[]) {
        for (let role_name of roles) {
            let role = await this.roleService.findById(role_name);
            let gr = await this.groupRoleRepository.findOne({
                where: {
                    group: group,
                    tenant: {id: group.tenant.id},
                    role: role
                },
            })
            await this.groupRoleRepository.remove(gr);
        }

        let users = await this.findGroupUsers(group);

        for (const user of users) {
            await this.roleService.addRoles(user, group.tenant, roles);
        }
    }
}
