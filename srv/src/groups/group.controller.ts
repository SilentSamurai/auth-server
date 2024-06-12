import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Delete,
    Get,
    Param, Patch,
    Post, Put,
    Request,
    UseInterceptors
} from "@nestjs/common";
import {ConfigService} from "../config/config.service";
import {ValidationPipe} from "../validation/validation.pipe";
import {ValidationSchema} from "../validation/validation.schema";
import {TenantService} from "../tenants/tenant.service";
import {GroupService} from "./group.service";

@Controller('api/group')
@UseInterceptors(ClassSerializerInterceptor)
export class GroupController {

    constructor(
        private readonly configService: ConfigService,
        private readonly groupService: GroupService,
        private readonly tenantService: TenantService,
    ) {
    }

    @Post('/create')
    async createGroup(
        @Request() request,
        @Body(new ValidationPipe(ValidationSchema.CreateGroupSchema)) body: { name: string, tenantId: string }
    ): Promise<any> {
        let tenant = await this.tenantService.findById(body.tenantId);
        let group = await this.groupService.create(body.name, tenant);
        return group;
    }

    @Get('/:groupId')
    async getGroup(
        @Request() request,
        @Param('groupId') groupId: string,
    ): Promise<any> {
        let group = await this.groupService.findById(groupId);
        let roles = await this.groupService.findGroupRoles(group);
        let users = await this.groupService.findGroupUsers(group);
        return {
            group: group,
            roles: roles,
            users: users
        };
    }


    @Patch('/:groupId/update')
    async updateGroup(
        @Request() request,
        @Param('groupId') groupId: string,
        @Body(new ValidationPipe(ValidationSchema.UpdateGroupSchema)) body: { name: string }
    ): Promise<any> {
        let group = await this.groupService.findById(groupId);
        await this.groupService.updateGroup(group, body);
        return group;
    }

    @Delete('/:groupId/delete')
    async deleteGroup(
        @Request() request,
        @Param('groupId') groupId: string
    ): Promise<any> {
        let group = await this.groupService.findById(groupId);
        await this.groupService.deleteById(groupId);
        return group;
    }


    @Post('/:groupId/add-roles')
    async addRole(
        @Request() request,
        @Param('groupId') groupId: string,
        @Body(new ValidationPipe(ValidationSchema.UpdateGroupRole)) body: { roles: string[] }
    ): Promise<any> {
        let group = await this.groupService.findById(groupId);
        await this.groupService.addRoles(group, body.roles);
        let roles = await this.groupService.findGroupRoles(group);
        return {
            group: group,
            roles: roles,
        };
    }

    @Post('/:groupId/remove-roles')
    async removeRole(
        @Request() request,
        @Param('groupId') groupId: string,
        @Body(new ValidationPipe(ValidationSchema.UpdateGroupRole)) body: { roles: string[] }
    ): Promise<any> {
        let group = await this.groupService.findById(groupId);
        await this.groupService.removeRoles(group, body.roles);
        let roles = await this.groupService.findGroupRoles(group);
        return {
            group: group,
            roles: roles,
        };
    }

    @Post('/:groupId/add-users')
    async addUsers(
        @Request() request,
        @Param('groupId') groupId: string,
        @Body(new ValidationPipe(ValidationSchema.UpdateGroupUser)) body: { users: string[] }
    ): Promise<any> {
        let group = await this.groupService.findById(groupId);
        await this.groupService.addUser(group, body.users);
        let users = await this.groupService.findGroupUsers(group);
        return {
            group: group,
            users: users,
        };
    }

    @Post('/:groupId/remove-users')
    async removeUsers(
        @Request() request,
        @Param('groupId') groupId: string,
        @Body(new ValidationPipe(ValidationSchema.UpdateGroupUser)) body: { users: string[] }
    ): Promise<any> {
        let group = await this.groupService.findById(groupId);
        await this.groupService.removeUser(group, body.users);
        let users = await this.groupService.findGroupUsers(group);
        return {
            group: group,
            users: users,
        };
    }


}
