import {Entity, PrimaryColumn} from "typeorm";


@Entity({name: "tenant_members"})
export class TenantMember {


    @PrimaryColumn({name: "tenant_id"})
    tenantId: string;

    @PrimaryColumn({name: "user_id"})
    userId: string;

}
