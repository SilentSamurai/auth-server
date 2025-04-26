import {
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "typeorm";
import {Tenant} from "./tenant.entity";
import {User} from "./user.entity";
import {Group} from "./group.entity"; // Used with ClassSerializerInterceptor to exclude from responses.

@Entity({name: "group_users"})
export class GroupUser {
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

    @PrimaryColumn({name: "user_id"})
    userId: string;

    @ManyToOne((type) => User)
    @JoinColumn({
        name: "user_id",
        referencedColumnName: "id",
    })
    user: User;

    @CreateDateColumn({name: "created_at"})
    createdAt: Date;
}
