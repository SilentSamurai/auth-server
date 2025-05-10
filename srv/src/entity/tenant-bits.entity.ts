import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique, JoinColumn } from 'typeorm';
import { Tenant } from './tenant.entity';

@Entity({ name: 'tenant_bits' })
@Unique(['tenant', 'key', 'ownerTenant'])
export class TenantBits {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Tenant, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tenant_id', referencedColumnName: 'id' })
    tenant: Tenant;

    @ManyToOne(() => Tenant, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'owner_tenant_id', referencedColumnName: 'id' })
    ownerTenant: Tenant;

    @Column({ nullable: false })
    key: string;

    @Column({ nullable: false, type: 'text' })
    value: string;
} 