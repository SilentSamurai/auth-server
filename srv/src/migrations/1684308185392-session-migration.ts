import {MigrationInterface, QueryRunner, Table} from "typeorm"

export class SessionMigration1684308185392 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const DB_STRING_TYPE = "VARCHAR";

        // User table
        await queryRunner.createTable(
            new Table({
                name: "auth_code",
                columns: [
                    {
                        name: "code",
                        type: DB_STRING_TYPE,
                        length: "16",
                        isPrimary: true
                    },
                    {
                        name: "code_challenge",
                        type: DB_STRING_TYPE,
                        isNullable: false
                    },
                    {
                        name: "method",
                        type: DB_STRING_TYPE,
                        isNullable: false
                    },
                    {
                        name: "user_id",
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
            }),
            true,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("auth_code");
    }

}
