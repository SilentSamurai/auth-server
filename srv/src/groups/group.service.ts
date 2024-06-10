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

@Injectable()
export class GroupService {

    constructor(
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
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


}
