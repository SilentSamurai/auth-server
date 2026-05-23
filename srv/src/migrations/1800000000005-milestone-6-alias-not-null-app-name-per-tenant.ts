import {MigrationInterface, QueryRunner, TableColumn, TableUnique} from "typeorm";

export class Milestone6AliasNotNullAndAppNamePerTenant1800000000005 implements MigrationInterface {
    name = 'Milestone6AliasNotNullAndAppNamePerTenant1800000000005'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ── Make clients.alias NOT NULL ──
        await queryRunner.dropUniqueConstraint("clients", "UQ_clients_alias");
        await queryRunner.changeColumn("clients", "alias", new TableColumn({
            name: "alias",
            type: "VARCHAR",
            isNullable: false,
        }));
        await queryRunner.createUniqueConstraint("clients", new TableUnique({
            name: "UQ_clients_alias",
            columnNames: ["alias"]
        }));

        // ── Add tenant-level unique constraint on apps(owner_tenant_id, name) ──
        await queryRunner.createUniqueConstraint("apps", new TableUnique({
            name: "UQ_apps_name_per_tenant",
            columnNames: ["owner_tenant_id", "name"]
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropUniqueConstraint("apps", "UQ_apps_name_per_tenant");
        await queryRunner.dropUniqueConstraint("clients", "UQ_clients_alias");
        await queryRunner.changeColumn("clients", "alias", new TableColumn({
            name: "alias",
            type: "VARCHAR",
            isNullable: true,
        }));
        await queryRunner.createUniqueConstraint("clients", new TableUnique({
            name: "UQ_clients_alias",
            columnNames: ["alias"]
        }));
    }
}
