import {Column, Entity, PrimaryColumn} from "typeorm";


@Entity({name: "tenant_members"})
export class TenantMember {


    @PrimaryColumn({name: "tenant_id"})
    tenantId: string;

    @PrimaryColumn({name: "user_id"})
    userId: string;

    @Column({name: "refresh_token", length: 128, nullable: false})
    refreshToken: string;

    @Column({name: "refreshed_at"})
    refreshedAt: Date;

    public isTokenExpired(expiration: number): boolean {
        let expiredAt = this.refreshedAt.getTime() + expiration;
        return expiredAt < Date.now();
    }

}
