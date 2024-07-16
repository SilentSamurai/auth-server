import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Request,
    UseInterceptors
} from "@nestjs/common";
import {ConfigService} from "../config/config.service";
import {ValidationPipe} from "../validation/validation.pipe";
import {ValidationSchema} from "../validation/validation.schema";
import {TenantService} from "../services/tenant.service";
import {GroupService} from "../services/group.service";

@Controller('/api')
@UseInterceptors(ClassSerializerInterceptor)
export class GroupController {

    constructor(
        private readonly configService: ConfigService,
        private readonly groupService: GroupService,
        private readonly tenantService: TenantService,
    ) {
    }

    @Get('/tenant/:tenantId/groups')
    async getGroupsInTenant(
        @Request() request,
        @Param('tenantId') tenantId: string,
    ): Promise<any> {
        let tenant = await this.tenantService.findById(request, tenantId);
        return await this.groupService.findByTenantId(request, tenant.id);
    }

    @Post('/group/create')
    async createGroup(
        @Request() request,
        @Body(new ValidationPipe(ValidationSchema.CreateGroupSchema)) body: { name: string, tenantId: string }
    ): Promise<any> {
        let tenant = await this.tenantService.findById(request, body.tenantId);
        let group = await this.groupService.create(request, body.name, tenant);
        return group;
    }

    @Get('/group/:groupId')
    async getGroup(
        @Request() request,
        @Param('groupId') groupId: string,
    ): Promise<any> {
        let group = await this.groupService.findById(request, groupId);
        let roles = await this.groupService.findGroupRoles(request, group);
        let users = await this.groupService.findGroupUsers(request, group);
        return {
            group: group,
            roles: roles,
            users: users
        };
    }


    @Patch('/group/:groupId/update')
    async updateGroup(
        @Request() request,
        @Param('groupId') groupId: string,
        @Body(new ValidationPipe(ValidationSchema.UpdateGroupSchema)) body: { name: string }
    ): Promise<any> {
        let group = await this.groupService.findById(request, groupId);
        await this.groupService.updateGroup(request, group, body);
        return group;
    }

    @Delete('/group/:groupId/delete')
    async deleteGroup(
        @Request() request,
        @Param('groupId') groupId: string
    ): Promise<any> {
        let group = await this.groupService.findById(request, groupId);
        await this.groupService.deleteById(request, groupId);
        return group;
    }


    @Post('/group/:groupId/add-casl')
    async addRole(
        @Request() request,
        @Param('groupId') groupId: string,
        @Body(new ValidationPipe(ValidationSchema.UpdateGroupRole)) body: { roles: string[] }
    ): Promise<any> {
        let group = await this.groupService.findById(request, groupId);
        await this.groupService.addRoles(request, group, body.roles);
        let roles = await this.groupService.findGroupRoles(request, group);
        return {
            group: group,
            roles: roles,
        };
    }

    @Post('/group/:groupId/remove-casl')
    async removeRole(
        @Request() request,
        @Param('groupId') groupId: string,
        @Body(new ValidationPipe(ValidationSchema.UpdateGroupRole)) body: { roles: string[] }
    ): Promise<any> {
        let group = await this.groupService.findById(request, groupId);
        await this.groupService.removeRoles(request, group, body.roles);
        let roles = await this.groupService.findGroupRoles(request, group);
        return {
            group: group,
            roles: roles,
        };
    }

    @Post('/group/:groupId/add-users')
    async addUsers(
        @Request() request,
        @Param('groupId') groupId: string,
        @Body(new ValidationPipe(ValidationSchema.UpdateGroupUser)) body: { users: string[] }
    ): Promise<any> {
        let group = await this.groupService.findById(request, groupId);
        await this.groupService.addUser(request, group, body.users);
        let users = await this.groupService.findGroupUsers(request, group);
        return {
            group: group,
            users: users,
        };
    }

    @Post('/group/:groupId/remove-users')
    async removeUsers(
        @Request() request,
        @Param('groupId') groupId: string,
        @Body(new ValidationPipe(ValidationSchema.UpdateGroupUser)) body: { users: string[] }
    ): Promise<any> {
        let group = await this.groupService.findById(request, groupId);
        await this.groupService.removeUser(request, group, body.users);
        let users = await this.groupService.findGroupUsers(request, group);
        return {
            group: group,
            users: users,
        };
    }


}
