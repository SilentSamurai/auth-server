import {MigrationInterface, QueryRunner, Table} from "typeorm"

export class CreateInitialTables1681147242561 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {

        const DB_STRING_TYPE = "VARCHAR";
        const DB_UUID_GENERATOR = "uuid_generate_v4()";

        // User table
        await queryRunner.createTable(
            new Table({
                name: "user",
                columns: [
                    {
                        name: "id",
                        type: DB_STRING_TYPE,
                        length: "36",
                        generationStrategy: "uuid",
                        isPrimary: true,
                        default: DB_UUID_GENERATOR
                    },
                    {
                        name: "name",
                        type: DB_STRING_TYPE,
                        isNullable: false
                    },
                    {
                        name: "password",
                        type: DB_STRING_TYPE,
                        isNullable: false
                    },
                    {
                        name: "email",
                        type: DB_STRING_TYPE,
                        isUnique: true,
                        isNullable: false
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
                name: "tenant",
                columns: [
                    {
                        name: "id",
                        type: DB_STRING_TYPE,
                        length: "36",
                        generationStrategy: "uuid",
                        isPrimary: true,
                        default: DB_UUID_GENERATOR
                    },
                    {
                        name: "name",
                        type: DB_STRING_TYPE,
                        isNullable: false
                    },
                    {
                        name: "domain",
                        type: DB_STRING_TYPE,
                        isUnique: true,
                        isNullable: false
                    },
                    {
                        name: "client_id",
                        type: DB_STRING_TYPE,
                        isUnique: true,
                        isNullable: false
                    },
                    {
                        name: "client_secret",
                        type: DB_STRING_TYPE,
                        isNullable: false
                    },
                    {
                        name: "private_key",
                        type: DB_STRING_TYPE,
                        isNullable: false
                    },
                    {
                        name: "public_key",
                        type: DB_STRING_TYPE,
                        isNullable: false
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
                name: "scope",
                columns: [
                    {
                        name: "id",
                        type: DB_STRING_TYPE,
                        length: "36",
                        generationStrategy: "uuid",
                        isPrimary: true,
                        default: DB_UUID_GENERATOR
                    },
                    {
                        name: "name",
                        type: DB_STRING_TYPE,
                        isNullable: false
                    },
                    {
                        name: "tenant_id",
                        type: DB_STRING_TYPE,
                        length: "36",
                        isNullable: false
                    },
                    {
                        name: "is_removable",
                        type: "boolean",
                        default: true
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "now()",
                    },
                ],
                uniques: [
                    {
                        name: "tenant_scope_constrain",
                        columnNames: [
                            "tenant_id",
                            "name"
                        ]
                    }
                ]
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
                        isNullable: false
                    },
                    {
                        name: "user_id",
                        type: DB_STRING_TYPE,
                        length: "36",
                        isNullable: false
                    },
                    {
                        name: "refresh_token",
                        type: DB_STRING_TYPE,
                        length: "40",
                        isNullable: true
                    },
                    {
                        name: "refreshed_at",
                        type: "timestamp",
                        isNullable: true
                    },
                ],
                uniques: [
                    {
                        name: "tenant_membership_constrain",
                        columnNames: [
                            "tenant_id",
                            "user_id"
                        ]
                    }
                ],
                foreignKeys: [
                    {
                        name: "fk_tenant_membership_tenant_id",
                        columnNames: ["tenant_id"],
                        referencedColumnNames: ["id"],
                        referencedTableName: "tenant",
                        onDelete: "CASCADE",
                    },
                    {
                        name: "fk_tenant_membership_user_id",
                        columnNames: ["user_id"],
                        referencedColumnNames: ["id"],
                        referencedTableName: "user",
                        onDelete: "CASCADE",
                    }
                ]
            }),
            true,
        );

        await queryRunner.createTable(
            new Table({
                name: "user_scopes",
                columns: [
                    {
                        name: "tenant_id",
                        type: DB_STRING_TYPE,
                        length: "36",
                        isNullable: false
                    },
                    {
                        name: "user_id",
                        type: DB_STRING_TYPE,
                        length: "36",
                        isNullable: false
                    },
                    {
                        name: "scope_id",
                        type: DB_STRING_TYPE,
                        length: "36",
                        isNullable: false
                    },
                ],
                uniques: [
                    {
                        name: "user_scopes_constrain",
                        columnNames: [
                            "tenant_id",
                            "user_id",
                            "scope_id"
                        ]
                    }
                ],
                foreignKeys: [
                    {
                        columnNames: ["tenant_id"],
                        referencedColumnNames: ["id"],
                        referencedTableName: "tenant",
                        onDelete: "CASCADE",
                    },
                    {
                        columnNames: ["user_id"],
                        referencedColumnNames: ["id"],
                        referencedTableName: "user",
                        onDelete: "CASCADE",
                    },
                    {
                        columnNames: ["scope_id"],
                        referencedColumnNames: ["id"],
                        referencedTableName: "scope",
                    }
                ]
            }),
            true,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("user");
        await queryRunner.dropTable("tenant");
        await queryRunner.dropTable("scope");
        await queryRunner.dropTable("user_scopes");
        await queryRunner.dropTable("tenant_members");
    }

}
