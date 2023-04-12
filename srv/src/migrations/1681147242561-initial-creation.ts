import {MigrationInterface, QueryRunner, Table} from "typeorm"

export class CreateInitialTables1681147242561 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {

        // User table
        await queryRunner.createTable(
            new Table({
                name: "user",
                columns: [
                    {
                        name: "id",
                        type: "nvarchar",
                        length: "36",
                        generationStrategy: "uuid",
                        isPrimary: true,
                    },
                    {
                        name: "name",
                        type: "nvarchar",
                        isNullable: false
                    },
                    {
                        name: "password",
                        type: "nvarchar",
                        isNullable: false
                    },
                    {
                        name: "email",
                        type: "nvarchar",
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
                        type: "nvarchar",
                        length: "36",
                        generationStrategy: "uuid",
                        isPrimary: true,
                    },
                    {
                        name: "name",
                        type: "nvarchar",
                        isNullable: false
                    },
                    {
                        name: "domain",
                        type: "nvarchar",
                        isUnique: true,
                        isNullable: false
                    },
                    {
                        name: "client_id",
                        type: "nvarchar",
                        isUnique: true,
                        isNullable: false
                    },
                    {
                        name: "client_secret",
                        type: "nvarchar",
                        isNullable: false
                    },
                    {
                        name: "private_key",
                        type: "nvarchar",
                        isNullable: false
                    },
                    {
                        name: "public_key",
                        type: "nvarchar",
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
                        type: "nvarchar",
                        length: "36",
                        generationStrategy: "uuid",
                        isPrimary: true,
                    },
                    {
                        name: "name",
                        type: "nvarchar",
                        isNullable: false
                    },
                    {
                        name: "tenant_id",
                        type: "nvarchar",
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
                        type: "nvarchar",
                        length: "36",
                        isNullable: false
                    },
                    {
                        name: "user_id",
                        type: "nvarchar",
                        length: "36",
                        isNullable: false
                    },
                    {
                        name: "refresh_token",
                        type: "nvarchar",
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
                        type: "nvarchar",
                        length: "36",
                        isNullable: false
                    },
                    {
                        name: "user_id",
                        type: "nvarchar",
                        length: "36",
                        isNullable: false
                    },
                    {
                        name: "scope_id",
                        type: "nvarchar",
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
