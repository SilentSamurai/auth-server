import {
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "typeorm";
import {Tenant} from "./tenant.entity";
import {Group} from "./group.entity";
import {Role} from "./role.entity"; // Used with ClassSerializerInterceptor to exclude from responses.

@Entity({name: "group_roles"})
export class GroupRole {
    @PrimaryColumn({name: "group_id"})
    groupId: string;

    @ManyToOne((type) => Group)
    @JoinColumn({
        name: "group_id",
        referencedColumnName: "id",
    })
    group: Group;

    @PrimaryColumn({name: "tenant_id"})
    tenantId: string;

    @ManyToOne((type) => Tenant)
    @JoinColumn({
        name: "tenant_id",
        referencedColumnName: "id",
    })
    tenant: Tenant;

    @PrimaryColumn({name: "role_id"})
    roleId: string;

    @ManyToOne((type) => Role)
    @JoinColumn({
        name: "role_id",
        referencedColumnName: "id",
    })
    role: Role;

    @CreateDateColumn({name: "created_at"})
    createdAt: Date;
}
