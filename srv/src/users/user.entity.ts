import {Column, CreateDateColumn, Entity, ManyToMany, PrimaryGeneratedColumn} from 'typeorm';
import {Exclude} from 'class-transformer'; // Used with ClassSerializerInterceptor to exclude from responses.
import {Tenant} from "../tenants/tenant.entity";
import {Scope} from "../scopes/scope.entity";

@Entity({name: "user"})
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({nullable: false})
    @Exclude() // Exclude from responses.
    password: string;

    @Column({unique: true, nullable: false})
    email: string;

    @Column({nullable: false})
    name: string;

    @ManyToMany(() => Tenant, (tenant) => tenant.members)
    tenants: Tenant[];

    @ManyToMany(() => Scope, scope => scope.users)
    scopes: Scope[];

    @Column({default: false})
    @Exclude() // Exclude from responses.
    verified: boolean;

    @CreateDateColumn({name: "created_at"})
    createdAt: Date;
}
