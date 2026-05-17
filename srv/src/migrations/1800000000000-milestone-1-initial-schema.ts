import {MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableIndex, TableUnique} from "typeorm";

export class Milestone1InitialSchema1800000000000 implements MigrationInterface {
    name = 'Milestone1InitialSchema1800000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const DB_STRING_TYPE = "VARCHAR";
        const DB_UUID_GENERATOR = "uuid_generate_v4()";

        // ── Users table ──
        await queryRunner.createTable(
            new Table({
                name: "users",
                columns: [
                    {name: "id", type: DB_STRING_TYPE, length: "36", generationStrategy: "uuid", isPrimary: true, default: DB_UUID_GENERATOR},
                    {name: "name", type: DB_STRING_TYPE, length: "128", isNullable: false},
                    {name: "password", type: DB_STRING_TYPE, length: "128", isNullable: false},
                    {name: "email", type: DB_STRING_TYPE, isUnique: true, length: "128", isNullable: false},
                    {name: "verified", type: "boolean", default: false},
                    {name: "created_at", type: "timestamp", default: "now()"},
                ],
            }),
            true,
        );

        // ── Tenants table ──
        await queryRunner.createTable(
            new Table({
                name: "tenants",
                columns: [
                    {name: "id", type: DB_STRING_TYPE, length: "36", generationStrategy: "uuid", isPrimary: true, default: DB_UUID_GENERATOR},
                    {name: "name", type: DB_STRING_TYPE, isNullable: false},
                    {name: "domain", type: DB_STRING_TYPE, isUnique: true, isNullable: false},
                    {name: "client_id", type: DB_STRING_TYPE, isUnique: true, isNullable: false},
                    {name: "client_secret", type: DB_STRING_TYPE, isNullable: false},
                    {name: "secret_salt", type: DB_STRING_TYPE, isNullable: false},
                    {name: "private_key", type: DB_STRING_TYPE, isNullable: false},
                    {name: "public_key", type: DB_STRING_TYPE, isNullable: false},
                    {name: "created_at", type: "timestamp", default: "now()"},
                ],
            }),
            true,
        );

        // ── Roles table ──
        await queryRunner.createTable(
            new Table({
                name: "roles",
                columns: [
                    {name: "id", type: DB_STRING_TYPE, length: "36", generationStrategy: "uuid", isPrimary: true, default: DB_UUID_GENERATOR},
                    {name: "name", type: DB_STRING_TYPE, isNullable: false},
                    {name: "tenant_id", type: DB_STRING_TYPE, length: "36", isNullable: false},
                    {name: "is_removable", type: "boolean", default: true},
                    {name: "created_at", type: "timestamp", default: "now()"},
                ],
                uniques: [
                    {name: "tenant_role_constrain", columnNames: ["tenant_id", "name"]},
                ],
            }),
            true,
        );

        // ── Tenant members table ──
        await queryRunner.createTable(
            new Table({
                name: "tenant_members",
                columns: [
                    {name: "tenant_id", type: DB_STRING_TYPE, length: "36", isPrimary: true, isNullable: false},
                    {name: "user_id", type: DB_STRING_TYPE, length: "36", isPrimary: true, isNullable: false},
                ],
                foreignKeys: [
                    {name: "fk_tenant_membership_tenant_id", columnNames: ["tenant_id"], referencedColumnNames: ["id"], referencedTableName: "tenants", onDelete: "CASCADE"},
                    {name: "fk_tenant_membership_user_id", columnNames: ["user_id"], referencedColumnNames: ["id"], referencedTableName: "users", onDelete: "CASCADE"},
                ],
            }),
            true,
        );

        // ── User roles table ──
        await queryRunner.createTable(
            new Table({
                name: "user_roles",
                columns: [
                    {name: "tenant_id", type: DB_STRING_TYPE, length: "36", isPrimary: true, isNullable: false},
                    {name: "user_id", type: DB_STRING_TYPE, length: "36", isPrimary: true, isNullable: false},
                    {name: "role_id", type: DB_STRING_TYPE, length: "36", isPrimary: true, isNullable: false},
                    {name: "from_group", type: "BOOLEAN", isNullable: false, default: "FALSE"},
                ],
                foreignKeys: [
                    {columnNames: ["tenant_id"], referencedColumnNames: ["id"], referencedTableName: "tenants", onDelete: "CASCADE"},
                    {columnNames: ["user_id"], referencedColumnNames: ["id"], referencedTableName: "users", onDelete: "CASCADE"},
                    {columnNames: ["role_id"], referencedColumnNames: ["id"], referencedTableName: "roles"},
                ],
            }),
            true,
        );

        // ── Auth code table ──
        await queryRunner.createTable(
            new Table({
                name: "auth_code",
                columns: [
                    {name: "code", type: DB_STRING_TYPE, length: "16", isPrimary: true},
                    {name: "code_challenge", type: DB_STRING_TYPE, isNullable: false},
                    {name: "method", type: DB_STRING_TYPE, isNullable: false},
                    {name: "user_id", type: DB_STRING_TYPE, isNullable: false},
                    {name: "tenant_id", type: DB_STRING_TYPE, isNullable: false},
                    {name: "created_at", type: "timestamp", default: "now()"},
                ],
            }),
            true,
        );

        // ── Authorization table ──
        await queryRunner.createTable(
            new Table({
                name: "authorization",
                columns: [
                    {name: "id", type: DB_STRING_TYPE, length: "36", isPrimary: true, default: DB_UUID_GENERATOR, generationStrategy: "uuid"},
                    {name: "role_id", type: DB_STRING_TYPE, isNullable: false},
                    {name: "tenant_id", type: DB_STRING_TYPE, isNullable: false},
                    {name: "effect", type: "varchar", isNullable: false},
                    {name: "action", type: "varchar", isNullable: false},
                    {name: "subject", type: "varchar", isNullable: false},
                    {name: "conditions", type: "json", isNullable: true},
                ],
            }),
            true,
        );

        await queryRunner.createIndex("authorization", new TableIndex({name: "IDX_AUTHORIZATION_ROLE_ID", columnNames: ["role_id"]}));
        await queryRunner.createIndex("authorization", new TableIndex({name: "IDX_AUTHORIZATION_ROLE_TENANT", columnNames: ["role_id", "tenant_id"]}));
        await queryRunner.createForeignKey("authorization", new TableForeignKey({name: "FK_AUTHORIZATION_ROLE", columnNames: ["role_id"], referencedTableName: "roles", referencedColumnNames: ["id"], onDelete: "CASCADE"}));
        await queryRunner.createForeignKey("authorization", new TableForeignKey({name: "FK_AUTHORIZATION_TENANT", columnNames: ["tenant_id"], referencedTableName: "tenants", referencedColumnNames: ["id"], onDelete: "CASCADE"}));

        // ── Add description to roles + allow_sign_up to tenants ──
        await queryRunner.addColumn("roles", new TableColumn({name: "description", type: "varchar", length: "512", isNullable: true}));
        await queryRunner.addColumn("tenants", new TableColumn({name: "allow_sign_up", type: "boolean", isNullable: false, default: false}));

        // ── Add email rate limit columns to users ──
        await queryRunner.addColumns("users", [
            new TableColumn({name: "email_count", type: "integer", default: 0, isNullable: false}),
            new TableColumn({name: "email_count_reset_at", type: "timestamp", isNullable: true}),
        ]);

        // ── Add subscriber_tenant_hint to auth_code ──
        await queryRunner.addColumn("auth_code", new TableColumn({name: "subscriber_tenant_hint", type: "varchar", isNullable: true}));

        // ── Groups, group_users, group_roles ──
        await queryRunner.createTable(
            new Table({
                name: "groups",
                columns: [
                    {name: "id", type: DB_STRING_TYPE, length: "36", generationStrategy: "uuid", isPrimary: true, default: DB_UUID_GENERATOR},
                    {name: "name", type: DB_STRING_TYPE, isNullable: false},
                    {name: "tenant_id", type: DB_STRING_TYPE, isNullable: false},
                    {name: "created_at", type: "timestamp", default: "now()"},
                ],
                uniques: [{name: "tenant_group_name_unq_constrain", columnNames: ["tenant_id", "name"]}],
            }),
            true,
        );

        await queryRunner.createTable(
            new Table({
                name: "group_users",
                columns: [
                    {name: "group_id", type: DB_STRING_TYPE, isNullable: false, isPrimary: true},
                    {name: "tenant_id", type: DB_STRING_TYPE, isPrimary: true, isNullable: false},
                    {name: "user_id", type: DB_STRING_TYPE, isPrimary: true, isNullable: false},
                    {name: "created_at", type: "timestamp", default: "now()"},
                ],
                foreignKeys: [
                    {columnNames: ["tenant_id"], referencedColumnNames: ["id"], referencedTableName: "tenants", onDelete: "CASCADE"},
                    {columnNames: ["user_id"], referencedColumnNames: ["id"], referencedTableName: "users", onDelete: "CASCADE"},
                    {columnNames: ["group_id"], referencedColumnNames: ["id"], referencedTableName: "groups"},
                ],
            }),
            true,
        );

        await queryRunner.createTable(
            new Table({
                name: "group_roles",
                columns: [
                    {name: "group_id", type: DB_STRING_TYPE, isNullable: false, isPrimary: true},
                    {name: "tenant_id", type: DB_STRING_TYPE, isPrimary: true, isNullable: false},
                    {name: "role_id", type: DB_STRING_TYPE, isPrimary: true, isNullable: false},
                    {name: "created_at", type: "timestamp", default: "now()"},
                ],
                foreignKeys: [
                    {columnNames: ["tenant_id"], referencedColumnNames: ["id"], referencedTableName: "tenants", onDelete: "CASCADE"},
                    {columnNames: ["group_id"], referencedColumnNames: ["id"], referencedTableName: "groups", onDelete: "CASCADE"},
                    {columnNames: ["role_id"], referencedColumnNames: ["id"], referencedTableName: "roles"},
                ],
            }),
            true,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("group_roles");
        await queryRunner.dropTable("group_users");
        await queryRunner.dropTable("groups");
        await queryRunner.dropForeignKey("authorization", "FK_AUTHORIZATION_TENANT");
        await queryRunner.dropForeignKey("authorization", "FK_AUTHORIZATION_ROLE");
        await queryRunner.dropIndex("authorization", "IDX_AUTHORIZATION_ROLE_TENANT");
        await queryRunner.dropIndex("authorization", "IDX_AUTHORIZATION_ROLE_ID");
        await queryRunner.dropTable("authorization");
        await queryRunner.dropTable("auth_code");
        await queryRunner.dropTable("user_roles");
        await queryRunner.dropTable("tenant_members");
        await queryRunner.dropTable("roles");
        await queryRunner.dropTable("tenants");
        await queryRunner.dropTable("users");
    }
}
