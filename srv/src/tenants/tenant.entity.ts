import {Column, CreateDateColumn, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {Scope} from "../scopes/scope.entity";
import {Exclude} from "class-transformer";
import {User} from "../users/user.entity"; // Used with ClassSerializerInterceptor to exclude from responses.

@Entity({name: "tenant"})
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

    @OneToMany(type => Scope, scope => scope.tenant, {
        cascade: true,
        onDelete: "CASCADE"
    })
    scopes: Scope[];

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
}
