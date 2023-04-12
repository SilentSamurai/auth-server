import {Column, Entity, PrimaryColumn} from "typeorm";


@Entity({name: "tenant_members"})
export class TenantMember {


    @PrimaryColumn({name: "tenant_id"})
    tenantId: string;

    @PrimaryColumn({name: "user_id"})
    userId: string;

    @Column({name: "refresh_token", length: 40, nullable: true})
    refreshToken: string;

    @Column({name: "refreshed_at"})
    refreshedAt: Date;

}
