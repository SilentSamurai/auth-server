import {MigrationInterface, QueryRunner, TableColumn} from "typeorm";

export class AddSubscriberTenantHintToAuthCode1710000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            "auth_code",
            new TableColumn({
                name: "subscriber_tenant_hint",
                type: "varchar",
                isNullable: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("auth_code", "subscriber_tenant_hint");
    }
} 