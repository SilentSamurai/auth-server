import {Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn,} from "typeorm";
import {Tenant} from "./tenant.entity";
import {Role} from "./role.entity";
import {Action, Effect} from "../casl/actions.enum";

@Entity("authorization")
@Index(["role"])
@Index(["role", "tenant"])
export class Policy {
    @PrimaryGeneratedColumn("uuid", {name: "id"})
    id: string;

    @ManyToOne((type) => Role)
    @JoinColumn({
        name: "role_id",
        referencedColumnName: "id",
    })
    role: Role;

    @ManyToOne((type) => Tenant, (tenant) => tenant.roles)
    @JoinColumn({
        name: "tenant_id",
        referencedColumnName: "id",
    })
    tenant: Tenant;

    @Column({
        type: "simple-enum",
        enum: Effect,
        default: Effect.ALLOW,
    })
    effect: Effect;

    @Column({
        type: "simple-enum",
        enum: Action,
    })
    action: Action;

    @Column({name: "subject", nullable: false})
    subject: string;

    @Column("simple-json", {name: "conditions"})
    conditions: object;
}
