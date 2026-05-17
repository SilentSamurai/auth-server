import {MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableUnique} from "typeorm";

export class Milestone5ResourceIndicatorsOnboarding1800000000004 implements MigrationInterface {
    name = 'Milestone5ResourceIndicatorsOnboarding1800000000004'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ── Add require_auth_time to auth_code ──
        await queryRunner.addColumn("auth_code", new TableColumn({name: "require_auth_time", type: "boolean", default: false, isNullable: false}));

        // ── Resource indicator support ──
        await queryRunner.addColumn("clients", new TableColumn({name: "allowed_resources", type: "text", isNullable: true}));
        await queryRunner.addColumn("auth_code", new TableColumn({name: "resource", type: "varchar", length: "2048", isNullable: true}));

        // ── Remove legacy credential columns from tenants ──
        await queryRunner.dropColumn("tenants", "client_id");
        await queryRunner.dropColumn("tenants", "client_secret");
        await queryRunner.dropColumn("tenants", "secret_salt");

        // ── Add skip_session_confirm to tenants ──
        await queryRunner.addColumn("tenants", new TableColumn({name: "skip_session_confirm", type: "boolean", isNullable: false, default: false}));

        // ── Add client_id to apps (app-client identity) ──
        await queryRunner.addColumn("apps", new TableColumn({name: "client_id", type: "VARCHAR", isNullable: false}));
        await queryRunner.createUniqueConstraint("apps", new TableUnique({name: "UQ_apps_client_id", columnNames: ["client_id"]}));
        await queryRunner.createForeignKey("apps", new TableForeignKey({name: "FK_apps_client_id", columnNames: ["client_id"], referencedTableName: "clients", referencedColumnNames: ["id"], onDelete: "RESTRICT"}));

        // ── Add onboarding config to apps ──
        await queryRunner.addColumn("apps", new TableColumn({name: "onboarding_enabled", type: "boolean", isNullable: false, default: true}));
        await queryRunner.addColumn("apps", new TableColumn({name: "onboarding_callback_url", type: "varchar", isNullable: true}));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("apps", "onboarding_callback_url");
        await queryRunner.dropColumn("apps", "onboarding_enabled");
        const appsTable = await queryRunner.getTable("apps");
        const appsFk = appsTable?.foreignKeys.find(fk => fk.columnNames.indexOf("client_id") !== -1);
        if (appsFk) await queryRunner.dropForeignKey("apps", appsFk);
        const appsUq = appsTable?.uniques.find(u => u.columnNames.indexOf("client_id") !== -1);
        if (appsUq) await queryRunner.dropUniqueConstraint("apps", appsUq);
        await queryRunner.dropColumn("apps", "client_id");
        await queryRunner.dropColumn("tenants", "skip_session_confirm");
        await queryRunner.addColumn("tenants", new TableColumn({name: "client_id", type: "VARCHAR", isNullable: true}));
        await queryRunner.addColumn("tenants", new TableColumn({name: "client_secret", type: "VARCHAR", isNullable: true}));
        await queryRunner.addColumn("tenants", new TableColumn({name: "secret_salt", type: "VARCHAR", isNullable: true}));
        await queryRunner.dropColumn("auth_code", "resource");
        await queryRunner.dropColumn("clients", "allowed_resources");
        await queryRunner.dropColumn("auth_code", "require_auth_time");
    }
}
