import {MigrationInterface, QueryRunner, TableColumn} from "typeorm";

export class AddDescriptionToRoles1699999999999 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn("roles", new TableColumn({
            name: "description",
            type: "varchar",
            length: "512",
            isNullable: true
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("roles", "description");
    }
}