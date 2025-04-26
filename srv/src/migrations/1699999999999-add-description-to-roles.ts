import {MigrationInterface, QueryRunner, TableColumn} from "typeorm";

export class AddDescriptionToRoles1699999999999 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            "roles",
            new TableColumn({
                name: "description",
                type: "varchar",
                length: "512",
                isNullable: true,
            }),
        );

        await queryRunner.addColumn(
            "tenants",
            new TableColumn({
                name: "allow_sign_up",
                type: "boolean",
                isNullable: false,
                default: false,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("roles", "description");
        await queryRunner.dropColumn("tenants", "allow_sign_up");
    }
}
