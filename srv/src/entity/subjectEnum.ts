import {GroupRole} from "./group.roles.entity";
import {UserRole} from "./user.roles.entity";
import {Role} from "./role.entity";
import {TenantMember} from "./tenant.members.entity";
import {Tenant} from "./tenant.entity";
import {User} from "./user.entity";
import {Group} from "./group.entity";

export class SubjectEnum {
    public static USER = User.name;
    public static TENANT = Tenant.name;
    public static MEMBER = TenantMember.name;
    public static ROLE = Role.name;
    public static USER_ROLE = UserRole.name;
    public static GROUP = Group.name;
    public static GROUP_ROLE = GroupRole.name;


    public static entityMap = {
        "Users": SubjectEnum.USER,
        "Tenants": SubjectEnum.TENANT,
        "TenantMembers": SubjectEnum.MEMBER,
        "Roles": SubjectEnum.ROLE,
        "Groups": SubjectEnum.GROUP
    }

    public static getSubject(entity: string): string {
        return SubjectEnum.entityMap[entity];
    }

}
