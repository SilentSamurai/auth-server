import {Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {Scope} from "./scope.entity";
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

    @Column({nullable: false})
    @Exclude()
    privateKey: string;

    @Column({nullable: false})
    publicKey: string;

    @OneToMany(type => Scope, scope => scope.tenant)
    scopes: Scope[];

    @ManyToMany(() => User, (user) => user.tenants)
    @JoinTable()
    members: User[];
}
