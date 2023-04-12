import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    PrimaryGeneratedColumn
} from "typeorm";
import {Tenant} from "../tenants/tenant.entity";
import {User} from "../users/user.entity"; // Used with ClassSerializerInterceptor to exclude from responses.


@Entity({name: "scope"})
export class Scope {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({nullable: false})
    name: string;

    @ManyToOne(type => Tenant, tenant => tenant.scopes)
    @JoinColumn({
        name: "tenant_id",
        referencedColumnName: "id"
    })
    tenant: Tenant;

    @ManyToMany(() => User, user => user.scopes)
    @JoinTable({
        name: "user_scopes",
        joinColumns: [{
            name: "scope_id",
            referencedColumnName: "id"
        }, {
            name: "tenant_id",
            referencedColumnName: "tenant"
        }],
        inverseJoinColumns: [{
            name: "user_id",
            referencedColumnName: "id"
        }]
    })
    users: User[];

    @Column({nullable: false, default: true, name: "is_removable"})
    removable: boolean;

    @CreateDateColumn({name: "created_at"})
    createdAt: Date;
}
