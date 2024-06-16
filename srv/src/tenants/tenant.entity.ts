import {Column, CreateDateColumn, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {Role} from "../roles/role.entity";
import {Exclude} from "class-transformer";
import {User} from "../users/user.entity";
import {Group} from "../groups/group.entity"; // Used with ClassSerializerInterceptor to exclude from responses.

@Entity({name: "tenants"})
export class Tenant {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({nullable: false})
    name: string;

    @Column({unique: true, nullable: false})
    domain: string;

    @Column({unique: true, nullable: false, name: "client_id"})
    clientId: string;

    @Column({nullable: false, name: "client_secret"})
    @Exclude()
    clientSecret: string;

    @Column({nullable: false, name: "secret_salt"})
    @Exclude()
    secretSalt: string;

    @Column({nullable: false, name: "private_key"})
    @Exclude()
    privateKey: string;

    @Column({nullable: false, name: "public_key"})
    @Exclude()
    publicKey: string;

    @OneToMany(type => Role, role => role.tenant, {
        cascade: true,
        onDelete: "CASCADE"
    })
    roles: Role[];

    @ManyToMany(() => User, (user) => user.tenants)
    @JoinTable({
        name: "tenant_members",
        joinColumn: {
            name: "tenant_id",
            referencedColumnName: "id"
        },
        inverseJoinColumn: {
            name: "user_id",
            referencedColumnName: "id"
        }
    })
    members: User[];

    @CreateDateColumn({name: "created_at"})
    createdAt: Date;

    @OneToMany(type => Group, group => group.tenant, {
        cascade: true,
        onDelete: "CASCADE"
    })
    groups: Group[];
}
