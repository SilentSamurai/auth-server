import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";
import {Exclude} from 'class-transformer';
import {Role} from "../roles/role.entity"; // Used with ClassSerializerInterceptor to exclude from responses.

@Entity()
export class Tenant {
    @PrimaryGeneratedColumn("uuid")
    @Exclude() // Exclude from responses.
    id: string;

    @Column({unique: true, nullable: false})
    subdomain: string;

    @Column({nullable: false})
    name: string;

    // Return the array of names.
    roles: Role[];
}
