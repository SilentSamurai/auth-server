import {Column, CreateDateColumn, Entity, ManyToMany, PrimaryGeneratedColumn} from 'typeorm';
import {Exclude} from 'class-transformer'; // Used with ClassSerializerInterceptor to exclude from responses.
import {Tenant} from "../tenants/tenant.entity";
import {Scope} from "../scopes/scope.entity";

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @CreateDateColumn()
    createdAt: Date;

    @Column({nullable: false})
    @Exclude() // Exclude from responses.
    password: string;

    @Column({unique: true, nullable: false})
    email: string;

    @Column({default: ''})
    name: string;

    @ManyToMany(() => Tenant, (tenant) => tenant.members)
    tenants: Tenant[];

    @ManyToMany(() => Scope, scope => scope.users)
    scopes: Scope[];

    @Column({default: false})
    @Exclude() // Exclude from responses.
    verified: boolean;
}
