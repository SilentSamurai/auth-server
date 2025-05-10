import {Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn,} from "typeorm";
import {Tenant} from "./tenant.entity";

@Entity({name: "groups"})
export class Group {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({nullable: false})
    name: string;

    @Column({name: "tenant_id"})
    tenantId: string;

    @ManyToOne((type) => Tenant, (tenant) => tenant.groups)
    @JoinColumn({
        name: "tenant_id",
        referencedColumnName: "id",
    })
    tenant: Tenant;

    @CreateDateColumn({name: "created_at"})
    createdAt: Date;
}
