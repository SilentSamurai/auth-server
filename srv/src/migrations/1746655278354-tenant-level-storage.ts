import {MigrationInterface, QueryRunner, Table, TableForeignKey, TableUnique} from "typeorm";

export class TenantLevelStorage1746655278354 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const DB_STRING_TYPE = "VARCHAR";
        const DB_UUID_GENERATOR = "uuid_generate_v4()";
        await queryRunner.createTable(
            new Table({
                name: "tenant_bits",
                columns: [
                    {
                        name: "id",
                        type: DB_STRING_TYPE,
                        isPrimary: true,
                        isNullable: false,
                        generationStrategy: "uuid",
                        default: "uuid_generate_v4()",
                    },
                    {
                        name: "tenant_id",
                        type: DB_STRING_TYPE,
                        isNullable: false,
                    },
                    {
                        name: "owner_tenant_id",
                        type: DB_STRING_TYPE,
                        isNullable: false,
                    },
                    {
                        name: "key",
                        type: "varchar",
                        isNullable: false,
                    },
                    {
                        name: "value",
                        type: "text",
                        isNullable: false,
                    },
                ],
                uniques: [
                    new TableUnique({
                        name: "UQ_tenant_bits_key_owner",
                        columnNames: ["tenant_id", "key", "owner_tenant_id"],
                    }),
                ],
                foreignKeys: [
                    new TableForeignKey({
                        columnNames: ["tenant_id"],
                        referencedTableName: "tenants",
                        referencedColumnNames: ["id"],
                        onDelete: "CASCADE",
                        name: "FK_tenant_bits_tenant",
                    }),
                    new TableForeignKey({
                        columnNames: ["owner_tenant_id"],
                        referencedTableName: "tenants",
                        referencedColumnNames: ["id"],
                        onDelete: "CASCADE",
                        name: "FK_tenant_bits_owner_tenant",
                    }),
                ],
            }),
            true
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("tenant_bits");
    }

}
