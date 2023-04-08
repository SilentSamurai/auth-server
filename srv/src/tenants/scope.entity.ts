import {Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn, Unique} from "typeorm";
import {Tenant} from "./tenant.entity";
import {User} from "../users/user.entity"; // Used with ClassSerializerInterceptor to exclude from responses.

@Entity()
@Unique("scope_uniqueness", ["name", "tenant"])
export class Scope {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({nullable: false})
    name: string;

    @ManyToOne(type => Tenant, tenant => tenant.scopes)
    @JoinColumn()
    tenant: Tenant;

    @ManyToMany(() => User, user => user.scopes)
    @JoinTable()
    users: User[];
}
