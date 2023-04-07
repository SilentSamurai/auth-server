import {Column, CreateDateColumn, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn} from 'typeorm';
import {Exclude, Transform} from 'class-transformer'; // Used with ClassSerializerInterceptor to exclude from responses.
import {Role} from '../roles/role.entity';
import {Tenant} from "../tenants/tenant.entity";
import {Scope} from "../tenants/scope.entity";

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    @Exclude() // Exclude from responses.
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

    @ManyToMany(() => Role)
    @JoinTable()
    @Transform(({value}) => value.map(x => x.name)) // Return the array of names.
    @Exclude()
    roles: Role[];

    @ManyToMany(() => Tenant, (tenant) => tenant.members)
    tenants: Tenant[];

    @ManyToMany(() => Scope, scope => scope.users)
    scopes: Scope[];

    @Column({default: false})
    @Exclude() // Exclude from responses.
    verified: boolean;
}
