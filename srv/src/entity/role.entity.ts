import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import {Tenant} from "./tenant.entity";
import {User} from "./user.entity";
import {App} from "./app.entity"; // Used with ClassSerializerInterceptor to exclude from responses.

@Entity({name: "roles"})
export class Role {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({nullable: false})
    name: string;

    @Column({nullable: true})
    description?: string;

    @ManyToOne((type) => Tenant, (tenant) => tenant.roles)
    @JoinColumn({
        name: "tenant_id",
        referencedColumnName: "id",
    })
    tenant: Tenant;

    // Reference to the App that this role belongs to (optional if the role is global)
    @ManyToOne(() => App, app => app.roles, {nullable: true})
    @JoinColumn({name: "app_id", referencedColumnName: "id"})
    app?: App;

    @ManyToMany(() => User, (user) => user.roles)
    @JoinTable({
        name: "user_roles",
        joinColumns: [
            {
                name: "role_id",
                referencedColumnName: "id",
            },
            {
                name: "tenant_id",
                referencedColumnName: "tenant",
            },
        ],
        inverseJoinColumns: [
            {
                name: "user_id",
                referencedColumnName: "id",
            },
        ],
    })
    users: User[];

    @Column({nullable: false, default: true, name: "is_removable"})
    removable: boolean;

    @CreateDateColumn({name: "created_at"})
    createdAt: Date;
}
