import {Entity, PrimaryColumn} from "typeorm";


@Entity({name: "user_scopes"})
export class UserScope {


    @PrimaryColumn({name: "tenant_id"})
    tenantId: string;

    @PrimaryColumn({name: "user_id"})
    userId: string;

    @PrimaryColumn({name: "scope_id"})
    scopeId: string;

}
