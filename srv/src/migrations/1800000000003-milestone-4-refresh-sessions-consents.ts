import {MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableIndex, TableUnique} from "typeorm";

export class Milestone4RefreshSessionsConsents1800000000003 implements MigrationInterface {
    name = 'Milestone4RefreshSessionsConsents1800000000003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const DB_STRING_TYPE = "VARCHAR";
        const DB_UUID_GENERATOR = "uuid_generate_v4()";

        // ── Refresh tokens table ──
        await queryRunner.createTable(
            new Table({
                name: "refresh_tokens",
                columns: [
                    {name: "id", type: DB_STRING_TYPE, length: "36", isPrimary: true, generationStrategy: "uuid", default: DB_UUID_GENERATOR},
                    {name: "token_hash", type: DB_STRING_TYPE, isNullable: false},
                    {name: "family_id", type: DB_STRING_TYPE, length: "36", isNullable: false},
                    {name: "parent_id", type: DB_STRING_TYPE, length: "36", isNullable: true},
                    {name: "user_id", type: DB_STRING_TYPE, length: "36", isNullable: false},
                    {name: "client_id", type: DB_STRING_TYPE, isNullable: false},
                    {name: "tenant_id", type: DB_STRING_TYPE, length: "36", isNullable: false},
                    {name: "scope", type: DB_STRING_TYPE, isNullable: false},
                    {name: "absolute_expires_at", type: "datetime", isNullable: false},
                    {name: "expires_at", type: "datetime", isNullable: false},
                    {name: "revoked", type: "boolean", default: false},
                    {name: "used_at", type: "datetime", isNullable: true},
                    {name: "created_at", type: "timestamp", default: "now()"},
                ],
                uniques: [new TableUnique({name: "UQ_refresh_tokens_parent_id", columnNames: ["parent_id"]})],
                indices: [
                    new TableIndex({name: "IDX_refresh_tokens_token_hash", columnNames: ["token_hash"]}),
                    new TableIndex({name: "IDX_refresh_tokens_family_id", columnNames: ["family_id"]}),
                ],
                foreignKeys: [new TableForeignKey({name: "FK_refresh_tokens_user", columnNames: ["user_id"], referencedTableName: "users", referencedColumnNames: ["id"], onDelete: "CASCADE"})],
            }),
            true,
        );

        // ── Tenant keys table + drop legacy key columns ──
        await queryRunner.createTable(
            new Table({
                name: "tenant_keys",
                columns: [
                    {name: "id", type: DB_STRING_TYPE, length: "36", isPrimary: true, generationStrategy: "uuid", default: DB_UUID_GENERATOR},
                    {name: "tenant_id", type: DB_STRING_TYPE, length: "36", isNullable: false},
                    {name: "key_version", type: "int", isNullable: false},
                    {name: "kid", type: DB_STRING_TYPE, length: "64", isNullable: false},
                    {name: "public_key", type: "text", isNullable: false},
                    {name: "private_key", type: "text", isNullable: false},
                    {name: "is_current", type: "boolean", isNullable: false, default: false},
                    {name: "created_at", type: "timestamp", isNullable: false, default: "now()"},
                    {name: "superseded_at", type: "timestamp", isNullable: true},
                    {name: "deactivated_at", type: "timestamp", isNullable: true},
                ],
                uniques: [
                    new TableUnique({name: "UQ_tenant_keys_tenant_version", columnNames: ["tenant_id", "key_version"]}),
                    new TableUnique({name: "UQ_tenant_keys_kid", columnNames: ["kid"]}),
                ],
                foreignKeys: [new TableForeignKey({name: "FK_tenant_keys_tenant", columnNames: ["tenant_id"], referencedTableName: "tenants", referencedColumnNames: ["id"], onDelete: "CASCADE"})],
            }),
            true,
        );

        await queryRunner.createIndex("tenant_keys", new TableIndex({name: "IDX_tenant_keys_tenant_active", columnNames: ["tenant_id"], where: "deactivated_at IS NULL"}));
        await queryRunner.createIndex("tenant_keys", new TableIndex({name: "IDX_tenant_keys_tenant_current", columnNames: ["tenant_id"], where: "is_current = true"}));
        await queryRunner.createIndex("tenant_keys", new TableIndex({name: "IDX_tenant_keys_kid", columnNames: ["kid"], where: "deactivated_at IS NULL"}));
        await queryRunner.createIndex("tenant_keys", new TableIndex({name: "IDX_tenant_keys_superseded_cleanup", columnNames: ["superseded_at"], where: "deactivated_at IS NULL AND is_current = false"}));

        await queryRunner.dropColumn("tenants", "private_key");
        await queryRunner.dropColumn("tenants", "public_key");

        // ── Add nonce to auth_code ──
        await queryRunner.addColumn("auth_code", new TableColumn({name: "nonce", type: "varchar", length: "512", isNullable: true}));

        // ── Login sessions table + sid columns ──
        await queryRunner.createTable(
            new Table({
                name: "login_sessions",
                columns: [
                    {name: "sid", type: DB_STRING_TYPE, length: "36", isPrimary: true},
                    {name: "user_id", type: DB_STRING_TYPE, length: "36", isNullable: false},
                    {name: "tenant_id", type: DB_STRING_TYPE, length: "36", isNullable: false},
                    {name: "auth_time", type: "integer", isNullable: false},
                    {name: "expires_at", type: "datetime", isNullable: false},
                    {name: "invalidated_at", type: "datetime", isNullable: true},
                    {name: "created_at", type: "timestamp", default: "now()"},
                ],
                indices: [
                    new TableIndex({name: "IDX_login_sessions_user_id", columnNames: ["user_id"]}),
                    new TableIndex({name: "IDX_login_sessions_tenant_id", columnNames: ["tenant_id"]}),
                ],
            }),
            true,
        );

        await queryRunner.addColumn("auth_code", new TableColumn({name: "sid", type: "varchar", length: "36", isNullable: true}));
        await queryRunner.addColumn("refresh_tokens", new TableColumn({name: "sid", type: "varchar", length: "36", isNullable: true}));
        await queryRunner.createIndex("refresh_tokens", new TableIndex({name: "IDX_refresh_tokens_sid", columnNames: ["sid"]}));

        // ── User consents table ──
        await queryRunner.createTable(
            new Table({
                name: "user_consents",
                columns: [
                    {name: "id", type: DB_STRING_TYPE, length: "36", isPrimary: true, generationStrategy: "uuid", default: "uuid_generate_v4()"},
                    {name: "user_id", type: DB_STRING_TYPE, length: "36", isNullable: false},
                    {name: "client_id", type: DB_STRING_TYPE, isNullable: false},
                    {name: "granted_scopes", type: DB_STRING_TYPE, isNullable: false},
                    {name: "consent_version", type: "integer", isNullable: false, default: 1},
                    {name: "created_at", type: "timestamp", default: "now()"},
                    {name: "updated_at", type: "timestamp", default: "now()"},
                ],
                uniques: [new TableUnique({name: "UQ_user_consents_user_client", columnNames: ["user_id", "client_id"]})],
                indices: [
                    new TableIndex({name: "IDX_user_consents_user_id", columnNames: ["user_id"]}),
                    new TableIndex({name: "IDX_user_consents_client_id", columnNames: ["client_id"]}),
                ],
                foreignKeys: [new TableForeignKey({name: "FK_user_consents_user", columnNames: ["user_id"], referencedTableName: "users", referencedColumnNames: ["id"], onDelete: "CASCADE"})],
            }),
            true,
        );

        // ── Add alias to clients ──
        await queryRunner.addColumn("clients", new TableColumn({name: "alias", type: "VARCHAR", isNullable: true}));
        await queryRunner.createUniqueConstraint("clients", new TableUnique({name: "UQ_clients_alias", columnNames: ["alias"]}));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropUniqueConstraint("clients", "UQ_clients_alias");
        await queryRunner.dropColumn("clients", "alias");
        await queryRunner.dropTable("user_consents");
        await queryRunner.dropIndex("refresh_tokens", "IDX_refresh_tokens_sid");
        await queryRunner.dropColumn("refresh_tokens", "sid");
        await queryRunner.dropColumn("auth_code", "sid");
        await queryRunner.dropTable("login_sessions");
        await queryRunner.dropColumn("auth_code", "nonce");
        const DOWN_DB_STRING = "VARCHAR";
        await queryRunner.addColumn("tenants", new TableColumn({name: "private_key", type: DOWN_DB_STRING, isNullable: true}));
        await queryRunner.addColumn("tenants", new TableColumn({name: "public_key", type: DOWN_DB_STRING, isNullable: true}));
        await queryRunner.dropTable("tenant_keys");
        const rtTable = await queryRunner.getTable("refresh_tokens");
        if (rtTable) {
            for (const fk of rtTable.foreignKeys) await queryRunner.dropForeignKey("refresh_tokens", fk);
            await queryRunner.dropTable("refresh_tokens");
        }
    }
}
