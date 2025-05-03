import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {Tenant} from './tenant.entity';
import {App} from './app.entity';

/**
 * Enum representing possible status values for Subscription.
 */
export enum SubscriptionStatus {
    SUCCESS = 'success',
    PENDING = 'pending',
    CANCELED = 'canceled',
    FAILED = 'failed'
}

@Entity({name: 'subscriptions'})
export class Subscription {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Tenant, tenant => tenant.appSubscriptions)
    @JoinColumn({name: 'subscriber_tenant_id'})
    subscriber: Tenant;

    @ManyToOne(() => App)
    @JoinColumn({name: 'app_id'})
    app: App;

    @Column({
        type: 'simple-enum',
        enum: SubscriptionStatus
    })
    status: SubscriptionStatus;

    @Column({default: () => 'CURRENT_TIMESTAMP', name: 'subscribed_at'})
    subscribedAt: Date;

    /**
     * New field to store any error or status messages encountered during subscription calls.
     */
    @Column({type: 'text', nullable: true})
    message?: string;
}
