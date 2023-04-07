import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique} from "typeorm";
import {Exclude} from "class-transformer";
import {Tenant} from "./tenant.entity"; // Used with ClassSerializerInterceptor to exclude from responses.

@Entity()
@Unique("scope_uniqueness", ["name", "tenant"])
export class Scope {
    @PrimaryGeneratedColumn("uuid")
    @Exclude()
    id: string;

    @Column({nullable: false})
    name: string;

    @ManyToOne(type => Tenant, tenant => tenant.scopes)
    @JoinColumn()
    tenant: Tenant;
}
