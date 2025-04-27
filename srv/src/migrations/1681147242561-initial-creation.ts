import {MigrationInterface, QueryRunner, Table} from "typeorm";

export class CreateInitialTables1681147242561 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const DB_STRING_TYPE = "VARCHAR";
        const DB_UUID_GENERATOR = "uuid_generate_v4()";

        // User table
        await queryRunner.createTable(
            new Table({
                name: "users",
                columns: [
                    {
                        name: "id",
                        type: DB_STRING_TYPE,
                        length: "36",
                        generationStrategy: "uuid",
                        isPrimary: true,
                        default: DB_UUID_GENERATOR,
                    },
                    {
                        name: "name",
                        type: DB_STRING_TYPE,
                        length: "128",
                        isNullable: false,
                    },
                    {
                        name: "password",
                        type: DB_STRING_TYPE,
                        length: "128",
                        isNullable: false,
                    },
                    {
                        name: "email",
                        type: DB_STRING_TYPE,
                        isUnique: true,
                        length: "128",
                        isNullable: false,
                    },
                    {
                        name: "verified",
                        type: "boolean",
                        default: false,
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "now()",
                    },
                ],
            }),
            true,
        );

        await queryRunner.createTable(
            new Table({
                name: "tenants",
                columns: [
                    {
                        name: "id",
                        type: DB_STRING_TYPE,
                        length: "36",
                        generationStrategy: "uuid",
                        isPrimary: true,
                        default: DB_UUID_GENERATOR,
                    },
                    {
                        name: "name",
                        type: DB_STRING_TYPE,
                        isNullable: false,
                    },
                    {
                        name: "domain",
                        type: DB_STRING_TYPE,
                        isUnique: true,
                        isNullable: false,
                    },
                    {
                        name: "client_id",
                        type: DB_STRING_TYPE,
                        isUnique: true,
                        isNullable: false,
                    },
                    {
                        name: "client_secret",
                        type: DB_STRING_TYPE,
                        isNullable: false,
                    },
                    {
                        name: "secret_salt",
                        type: DB_STRING_TYPE,
                        isNullable: false,
                    },
                    {
                        name: "private_key",
                        type: DB_STRING_TYPE,
                        isNullable: false,
                    },
                    {
                        name: "public_key",
                        type: DB_STRING_TYPE,
                        isNullable: false,
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "now()",
                    },
                ],
            }),
            true,
        );

        await queryRunner.createTable(
            new Table({
                name: "roles",
                columns: [
                    {
                        name: "id",
                        type: DB_STRING_TYPE,
                        length: "36",
                        generationStrategy: "uuid",
                        isPrimary: true,
                        default: DB_UUID_GENERATOR,
                    },
                    {
                        name: "name",
                        type: DB_STRING_TYPE,
                        isNullable: false,
                    },
                    {
                        name: "tenant_id",
                        type: DB_STRING_TYPE,
                        length: "36",
                        isNullable: false,
                    },
                    {
                        name: "is_removable",
                        type: "boolean",
                        default: true,
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "now()",
                    },
                ],
                uniques: [
                    {
                        name: "tenant_role_constrain",
                        columnNames: ["tenant_id", "name"],
                    },
                ],
            }),
            true,
        );

        await queryRunner.createTable(
            new Table({
                name: "tenant_members",
                columns: [
                    {
                        name: "tenant_id",
                        type: DB_STRING_TYPE,
                        length: "36",
                        isPrimary: true,
                        isNullable: false,
                    },
                    {
                        name: "user_id",
                        type: DB_STRING_TYPE,
                        length: "36",
                        isPrimary: true,
                        isNullable: false,
                    },
                ],
                foreignKeys: [
                    {
                        name: "fk_tenant_membership_tenant_id",
                        columnNames: ["tenant_id"],
                        referencedColumnNames: ["id"],
                        referencedTableName: "tenants",
                        onDelete: "CASCADE",
                    },
                    {
                        name: "fk_tenant_membership_user_id",
                        columnNames: ["user_id"],
                        referencedColumnNames: ["id"],
                        referencedTableName: "users",
                        onDelete: "CASCADE",
                    },
                ],
            }),
            true,
        );

        await queryRunner.createTable(
            new Table({
                name: "user_roles",
                columns: [
                    {
                        name: "tenant_id",
                        type: DB_STRING_TYPE,
                        length: "36",
                        isPrimary: true,
                        isNullable: false,
                    },
                    {
                        name: "user_id",
                        type: DB_STRING_TYPE,
                        length: "36",
                        isPrimary: true,
                        isNullable: false,
                    },
                    {
                        name: "role_id",
                        type: DB_STRING_TYPE,
                        length: "36",
                        isPrimary: true,
                        isNullable: false,
                    },
                    {
                        name: "from_group",
                        type: "BOOLEAN",
                        isNullable: false,
                        default: "FALSE",
                    },
                ],
                foreignKeys: [
                    {
                        columnNames: ["tenant_id"],
                        referencedColumnNames: ["id"],
                        referencedTableName: "tenants",
                        onDelete: "CASCADE",
                    },
                    {
                        columnNames: ["user_id"],
                        referencedColumnNames: ["id"],
                        referencedTableName: "users",
                        onDelete: "CASCADE",
                    },
                    {
                        columnNames: ["role_id"],
                        referencedColumnNames: ["id"],
                        referencedTableName: "roles",
                    },
                ],
            }),
            true,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("users");
        await queryRunner.dropTable("tenants");
        await queryRunner.dropTable("roles");
        await queryRunner.dropTable("user_roles");
        await queryRunner.dropTable("tenant_members");
    }
}
