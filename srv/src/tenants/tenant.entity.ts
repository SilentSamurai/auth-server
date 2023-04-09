import {Column, Entity, JoinColumn, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {Scope} from "../scopes/scope.entity";
import {Exclude} from "class-transformer";
import {User} from "../users/user.entity"; // Used with ClassSerializerInterceptor to exclude from responses.

@Entity()
export class Tenant {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({nullable: false})
    name: string;

    @Column({unique: true, nullable: false})
    domain: string;

    @Column({unique: true, nullable: false})
    clientId: string;

    @Column({nullable: false})
    @Exclude()
    clientSecret: string;

    @Column({nullable: false})
    @Exclude()
    privateKey: string;

    @Column({nullable: false})
    publicKey: string;

    @OneToMany(type => Scope, scope => scope.tenant, {
        cascade: true,
        onDelete: "CASCADE"
    })
    @JoinColumn()
    scopes: Scope[];

    @ManyToMany(() => User, (user) => user.tenants)
    @JoinTable()
    members: User[];
}
