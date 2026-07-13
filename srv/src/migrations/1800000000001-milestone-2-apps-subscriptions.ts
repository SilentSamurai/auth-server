import {MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableUnique} from "typeorm";

export class Milestone2AppsSubscriptions1800000000001 implements MigrationInterface {
    name = 'Milestone2AppsSubscriptions1800000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const DB_STRING_TYPE = 'VARCHAR';
        const DB_UUID_GENERATOR = queryRunner.connection.options.type === 'postgres'
            ? 'uuid_generate_v4()'
            : undefined;

        // ── Apps table ──
        await queryRunner.createTable(
            new Table({
                name: 'apps',
                columns: [
                    {
                        name: 'id',
                        type: DB_STRING_TYPE,
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: DB_UUID_GENERATOR
                    },
                    {name: 'name', type: DB_STRING_TYPE, isNullable: false},
                    {name: 'description', type: DB_STRING_TYPE, isNullable: true},
                    {name: 'app_url', type: DB_STRING_TYPE, isNullable: true},
                    {name: 'is_public', type: "boolean", isNullable: false, default: false},
                    {name: 'owner_tenant_id', type: DB_STRING_TYPE, isNullable: false},
                    {name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP'},
                ],
            }),
            true,
        );

        await queryRunner.createForeignKey('apps', new TableForeignKey({
            columnNames: ['owner_tenant_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'tenants',
            onDelete: 'CASCADE',
        }));

        // ── Subscriptions table ──
        await queryRunner.createTable(
            new Table({
                name: 'subscriptions',
                columns: [
                    {
                        name: 'id',
                        type: DB_STRING_TYPE,
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: DB_UUID_GENERATOR
                    },
                    {name: 'subscriber_tenant_id', type: DB_STRING_TYPE, isNullable: false},
                    {name: 'app_id', type: DB_STRING_TYPE, isNullable: false},
                    {name: 'status', type: DB_STRING_TYPE, isNullable: false, length: '64'},
                    {name: 'message', type: DB_STRING_TYPE, isNullable: true, length: '2048'},
                    {name: 'subscribed_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP'},
                ],
                uniques: [{columnNames: ['subscriber_tenant_id', 'app_id'], name: 'UQ_subscription_tenant_app'}],
            }),
            true,
        );

        await queryRunner.createForeignKey('subscriptions', new TableForeignKey({
            columnNames: ['subscriber_tenant_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'tenants',
            onDelete: 'CASCADE',
        }));
        await queryRunner.createForeignKey('subscriptions', new TableForeignKey({
            columnNames: ['app_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'apps',
            onDelete: 'CASCADE',
        }));

        // ── Add app_id to roles ──
        await queryRunner.addColumn('roles', new TableColumn({name: 'app_id', type: DB_STRING_TYPE, isNullable: true}));
        await queryRunner.createForeignKey('roles', new TableForeignKey({
            columnNames: ['app_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'apps',
            onDelete: 'SET NULL',
        }));

        // ── Tenant bits (key-value storage) ──
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
                        default: DB_UUID_GENERATOR
                    },
                    {name: "tenant_id", type: DB_STRING_TYPE, isNullable: false},
                    {name: "owner_tenant_id", type: DB_STRING_TYPE, isNullable: false},
                    {name: "key", type: "varchar", isNullable: false},
                    {name: "value", type: "text", isNullable: false},
                ],
                uniques: [
                    new TableUnique({
                        name: "UQ_tenant_bits_key_owner",
                        columnNames: ["tenant_id", "key", "owner_tenant_id"]
                    }),
                ],
                foreignKeys: [
                    new TableForeignKey({
                        columnNames: ["tenant_id"],
                        referencedTableName: "tenants",
                        referencedColumnNames: ["id"],
                        onDelete: "CASCADE",
                        name: "FK_tenant_bits_tenant"
                    }),
                    new TableForeignKey({
                        columnNames: ["owner_tenant_id"],
                        referencedTableName: "tenants",
                        referencedColumnNames: ["id"],
                        onDelete: "CASCADE",
                        name: "FK_tenant_bits_owner_tenant"
                    }),
                ],
            }),
            true,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("tenant_bits");
        const rolesTable = await queryRunner.getTable('roles');
        const rolesFk = rolesTable?.foreignKeys.find(fk => fk.columnNames.indexOf('app_id') !== -1);
        if (rolesFk) await queryRunner.dropForeignKey('roles', rolesFk);
        await queryRunner.dropColumn('roles', 'app_id');
        const subsTable = await queryRunner.getTable('subscriptions');
        if (subsTable) {
            for (const fk of subsTable.foreignKeys) await queryRunner.dropForeignKey('subscriptions', fk);
            await queryRunner.dropTable('subscriptions');
        }
        const appsTable = await queryRunner.getTable('apps');
        if (appsTable) {
            for (const fk of appsTable.foreignKeys) await queryRunner.dropForeignKey('apps', fk);
            await queryRunner.dropTable('apps');
        }
    }
}
