import {MigrationInterface, QueryRunner, Table} from "typeorm";

export class Migrations1718012430697 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const DB_STRING_TYPE = "VARCHAR";
        const DB_UUID_GENERATOR = "uuid_generate_v4()";

        await queryRunner.createTable(new Table(
            {
                name: "groups",
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
                        isNullable: false
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "now()",
                    },
                ],
            }
        ), true);

        await queryRunner.createTable(new Table(
            {
                name: "group_users",
                columns: [
                    {
                        name: "group_id",
                        type: DB_STRING_TYPE,
                        isNullable: false,
                        isPrimary: true,
                    },
                    {
                        name: "tenant_id",
                        type: DB_STRING_TYPE,
                        isPrimary: true,
                        isNullable: false
                    },
                    {
                        name: "user_id",
                        type: DB_STRING_TYPE,
                        isPrimary: true,
                        isNullable: false
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "now()",
                    },
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
                        referencedTableName: "users",
                        onDelete: "CASCADE",
                    },
                    {
                        columnNames: ["group_id"],
                        referencedColumnNames: ["id"],
                        referencedTableName: "groups",
                    }
                ]
            }
        ), true);

        await queryRunner.createTable(new Table(
            {
                name: "group_roles",
                columns: [
                    {
                        name: "group_id",
                        type: DB_STRING_TYPE,
                        isNullable: false,
                        isPrimary: true,
                    },
                    {
                        name: "tenant_id",
                        type: DB_STRING_TYPE,
                        isPrimary: true,
                        isNullable: false
                    },
                    {
                        name: "role_id",
                        type: DB_STRING_TYPE,
                        isPrimary: true,
                        isNullable: false
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "now()",
                    },
                ],
                foreignKeys: [
                    {
                        columnNames: ["tenant_id"],
                        referencedColumnNames: ["id"],
                        referencedTableName: "tenant",
                        onDelete: "CASCADE",
                    },
                    {
                        columnNames: ["group_id"],
                        referencedColumnNames: ["id"],
                        referencedTableName: "groups",
                        onDelete: "CASCADE",
                    },
                    {
                        columnNames: ["role_id"],
                        referencedColumnNames: ["id"],
                        referencedTableName: "roles",
                    }
                ]
            }
        ), true)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("groups");
        await queryRunner.dropTable("group_users");
        await queryRunner.dropTable("group_roles");
    }

}
