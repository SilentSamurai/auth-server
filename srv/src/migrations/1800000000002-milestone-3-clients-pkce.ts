import {MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableUnique} from "typeorm";

export class Milestone3ClientsPkce1800000000002 implements MigrationInterface {
    name = 'Milestone3ClientsPkce1800000000002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const DB_STRING_TYPE = "VARCHAR";
        const DB_UUID_GENERATOR = queryRunner.connection.options.type === "postgres"
            ? "uuid_generate_v4()"
            : undefined;

        // ── Clients table ──
        await queryRunner.createTable(
            new Table({
                name: "clients",
                columns: [
                    {
                        name: "id",
                        type: DB_STRING_TYPE,
                        length: "36",
                        isPrimary: true,
                        generationStrategy: "uuid",
                        default: DB_UUID_GENERATOR
                    },
                    {name: "client_id", type: DB_STRING_TYPE, isNullable: false, isUnique: true},
                    {name: "client_secrets", type: "json", isNullable: true},
                    {name: "redirect_uris", type: "json", isNullable: true},
                    {name: "allowed_scopes", type: DB_STRING_TYPE, isNullable: true},
                    {name: "grant_types", type: DB_STRING_TYPE, isNullable: true},
                    {name: "response_types", type: DB_STRING_TYPE, isNullable: true},
                    {name: "token_endpoint_auth_method", type: DB_STRING_TYPE, default: "'client_secret_basic'"},
                    {name: "is_public", type: "boolean", default: false},
                    {name: "require_pkce", type: "boolean", default: false},
                    {name: "allow_password_grant", type: "boolean", default: false},
                    {name: "allow_refresh_token", type: "boolean", default: true},
                    {name: "name", type: DB_STRING_TYPE, isNullable: true},
                    {name: "created_at", type: "timestamp", default: "CURRENT_TIMESTAMP"},
                    {name: "tenant_id", type: DB_STRING_TYPE, length: "36", isNullable: false},
                ],
                uniques: [new TableUnique({name: "UQ_clients_client_id", columnNames: ["client_id"]})],
                foreignKeys: [new TableForeignKey({
                    name: "FK_clients_tenant",
                    columnNames: ["tenant_id"],
                    referencedTableName: "tenants",
                    referencedColumnNames: ["id"],
                    onDelete: "CASCADE"
                })],
            }),
            true,
        );

        // ── Add locked column to users ──
        await queryRunner.addColumn("users", new TableColumn({
            name: "locked",
            type: "boolean",
            isNullable: false,
            default: false
        }));

        // ── Add redirect_uri to auth_code ──
        await queryRunner.addColumn("auth_code", new TableColumn({
            name: "redirect_uri",
            type: "varchar",
            isNullable: true
        }));

        // ── Add binding columns to auth_code ──
        await queryRunner.addColumn("auth_code", new TableColumn({
            name: "client_id",
            type: "varchar",
            isNullable: false,
            default: "''"
        }));
        await queryRunner.addColumn("auth_code", new TableColumn({name: "scope", type: "varchar", isNullable: true}));
        await queryRunner.addColumn("auth_code", new TableColumn({
            name: "used",
            type: "boolean",
            isNullable: false,
            default: false
        }));
        await queryRunner.addColumn("auth_code", new TableColumn({
            name: "used_at",
            type: "timestamp",
            isNullable: true
        }));
        await queryRunner.addColumn("auth_code", new TableColumn({
            name: "expires_at",
            type: "timestamp",
            isNullable: false,
            default: "CURRENT_TIMESTAMP"
        }));

        // ── Add pkce_method_used to clients ──
        await queryRunner.addColumn("clients", new TableColumn({
            name: "pkce_method_used",
            type: "varchar",
            isNullable: true
        }));

        // ── Make auth_code PKCE columns nullable ──
        await queryRunner.changeColumn("auth_code", "code_challenge", new TableColumn({
            name: "code_challenge",
            type: "VARCHAR",
            isNullable: true,
            isUnique: false
        }));
        await queryRunner.changeColumn("auth_code", "method", new TableColumn({
            name: "method",
            type: "VARCHAR",
            isNullable: true
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.changeColumn("auth_code", "method", new TableColumn({
            name: "method",
            type: "VARCHAR",
            isNullable: false
        }));
        await queryRunner.changeColumn("auth_code", "code_challenge", new TableColumn({
            name: "code_challenge",
            type: "VARCHAR",
            isNullable: false,
            isUnique: true
        }));
        await queryRunner.dropColumn("clients", "pkce_method_used");
        await queryRunner.dropColumn("auth_code", "expires_at");
        await queryRunner.dropColumn("auth_code", "used_at");
        await queryRunner.dropColumn("auth_code", "used");
        await queryRunner.dropColumn("auth_code", "scope");
        await queryRunner.dropColumn("auth_code", "client_id");
        await queryRunner.dropColumn("auth_code", "redirect_uri");
        await queryRunner.dropColumn("users", "locked");
        await queryRunner.dropTable("clients");
    }
}
