import {Column, CreateDateColumn, Entity, PrimaryColumn} from "typeorm";

@Entity({name: "auth_code"})
export class AuthCode {
    @PrimaryColumn({name: "code", length: 16})
    code: string;

    @Column({name: "code_challenge", unique: true, nullable: false})
    codeChallenge: string;

    @Column({name: "method", nullable: false})
    method: string;

    @Column({name: "user_id", nullable: false})
    userId: string;

    @Column({name: "tenant_id", nullable: false})
    tenantId: string;

    @CreateDateColumn({name: "created_at"})
    createdAt: Date;
}
