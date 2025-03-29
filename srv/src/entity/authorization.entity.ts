import {Entity, Column, PrimaryGeneratedColumn, Index, ManyToOne, JoinColumn} from 'typeorm';
import {Tenant} from "./tenant.entity";
import {Role} from "./role.entity";

@Entity('authorization')
@Index(['role_id'])
@Index(['role_id', 'tenant_id'])
export class Authorization {
    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id: string;

    @ManyToOne(type => Role)
    @JoinColumn({
        name: "role_id",
        referencedColumnName: "id"
    })
    role: Role;

    @ManyToOne(type => Tenant, tenant => tenant.roles)
    @JoinColumn({
        name: "tenant_id",
        referencedColumnName: "id"
    })
    tenant: Tenant;

    @Column({ name: 'effect'  , nullable: false })
    effect: string;

    @Column({ name: 'action'  , nullable: false })
    action: string;

    @Column({ name: 'resource'  , nullable: false })
    resource: string;

    @Column('json', { name: 'conditions' })
    conditions: object;
}