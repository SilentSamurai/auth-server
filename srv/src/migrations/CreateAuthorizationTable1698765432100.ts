import {MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex,} from "typeorm";

export class CreateAuthorizationTable1698765432100
    implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const DB_STRING_TYPE = "VARCHAR";
        const DB_UUID_GENERATOR = "uuid_generate_v4()";
        // Create the policy table
        await queryRunner.createTable(
            new Table({
                name: "authorization",
                columns: [
                    {
                        name: "id",
                        type: DB_STRING_TYPE,
                        length: "36",
                        isPrimary: true,
                        default: DB_UUID_GENERATOR,
                        generationStrategy: "uuid",
                    },
                    {
                        name: "role_id",
                        type: DB_STRING_TYPE,
                        isNullable: false,
                    },
                    {
                        name: "tenant_id",
                        type: DB_STRING_TYPE,
                        isNullable: false,
                    },
                    {
                        name: "effect",
                        type: "varchar",
                        isNullable: false,
                    },
                    {
                        name: "action",
                        type: "varchar",
                        isNullable: false,
                    },
                    {
                        name: "subject",
                        type: "varchar",
                        isNullable: false,
                    },
                    {
                        name: "conditions",
                        type: "json",
                        isNullable: true,
                    },
                ],
            }),
            true,
        );

        // Create indexes
        await queryRunner.createIndex(
            "authorization",
            new TableIndex({
                name: "IDX_AUTHORIZATION_ROLE_ID",
                columnNames: ["role_id"],
            }),
        );

        await queryRunner.createIndex(
            "authorization",
            new TableIndex({
                name: "IDX_AUTHORIZATION_ROLE_TENANT",
                columnNames: ["role_id", "tenant_id"],
            }),
        );

        // Create foreign keys
        await queryRunner.createForeignKey(
            "authorization",
            new TableForeignKey({
                name: "FK_AUTHORIZATION_ROLE",
                columnNames: ["role_id"],
                referencedTableName: "roles",
                referencedColumnNames: ["id"],
                onDelete: "CASCADE",
            }),
        );

        await queryRunner.createForeignKey(
            "authorization",
            new TableForeignKey({
                name: "FK_AUTHORIZATION_TENANT",
                columnNames: ["tenant_id"],
                referencedTableName: "tenants", // Assuming the table name is 'tenants'
                referencedColumnNames: ["id"],
                onDelete: "CASCADE",
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys first
        await queryRunner.dropForeignKey(
            "authorization",
            "FK_AUTHORIZATION_TENANT",
        );
        await queryRunner.dropForeignKey(
            "authorization",
            "FK_AUTHORIZATION_ROLE",
        );

        // Drop indexes
        await queryRunner.dropIndex(
            "authorization",
            "IDX_AUTHORIZATION_ROLE_TENANT",
        );
        await queryRunner.dropIndex(
            "authorization",
            "IDX_AUTHORIZATION_ROLE_ID",
        );

        // Drop the table
        await queryRunner.dropTable("authorization");
    }
}
