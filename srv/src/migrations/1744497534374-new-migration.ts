import {MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey} from "typeorm";

export class SubscriptionAndApps1744497534374 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {

        const DB_STRING_TYPE = 'VARCHAR';
        const DB_UUID_GENERATOR = 'uuid_generate_v4()';

        await queryRunner.createTable(
            new Table({
                name: 'apps',
                columns: [
                    {
                        name: 'id',
                        type: DB_STRING_TYPE,
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: DB_UUID_GENERATOR,
                    },
                    {
                        name: 'name',
                        type: DB_STRING_TYPE,
                        isNullable: false,
                    },
                    {
                        name: 'description',
                        type: DB_STRING_TYPE,
                        isNullable: true,
                    },
                    {
                        name: 'app_url',
                        type: DB_STRING_TYPE,
                        isNullable: true,
                    },
                    {
                        name: 'owner_tenant_id',
                        type: DB_STRING_TYPE,
                        isNullable: false,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        // Foreign key: apps.owner_tenant_id -> tenants.id
        await queryRunner.createForeignKey(
            'apps',
            new TableForeignKey({
                columnNames: ['owner_tenant_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'tenants',
                onDelete: 'CASCADE',
            }),
        );

        // ─────────────────────────────────────────────────────
        // 7) CREATE SUBSCRIPTIONS TABLE
        // ─────────────────────────────────────────────────────
        await queryRunner.createTable(
            new Table({
                name: 'subscriptions',
                columns: [
                    {
                        name: 'id',
                        type: DB_STRING_TYPE,
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: DB_UUID_GENERATOR,
                    },
                    {
                        name: 'subscriber_tenant_id',
                        type: DB_STRING_TYPE,
                        isNullable: false,
                    },
                    {
                        name: 'app_id',
                        type: DB_STRING_TYPE,
                        isNullable: false,
                    },
                    {
                        name: 'status',
                        type: DB_STRING_TYPE,
                        isNullable: false,
                        length: '64'
                    },
                    {
                        name: 'message',
                        type: DB_STRING_TYPE,
                        isNullable: true,
                        length: '2048'
                    },
                    {
                        name: 'subscribed_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
                uniques: [
                    {
                        columnNames: ['subscriber_tenant_id', 'app_id'],
                        name: 'UQ_subscription_tenant_app'
                    }
                ]
            }),
            true,
        );

        // Foreign keys: subscriber_tenant_id -> tenants, app_id -> apps
        await queryRunner.createForeignKey(
            'subscriptions',
            new TableForeignKey({
                columnNames: ['subscriber_tenant_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'tenants',
                onDelete: 'CASCADE',
            }),
        );
        await queryRunner.createForeignKey(
            'subscriptions',
            new TableForeignKey({
                columnNames: ['app_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'apps',
                onDelete: 'CASCADE',
            }),
        );

        // ─────────────────────────────────────────────────────
        // 8) ADD APP_ID COLUMN TO ROLES
        // ─────────────────────────────────────────────────────
        await queryRunner.addColumn(
            'roles',
            new TableColumn({
                name: 'app_id',
                type: DB_STRING_TYPE,
                isNullable: true,
            }),
        );
        await queryRunner.createForeignKey(
            'roles',
            new TableForeignKey({
                columnNames: ['app_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'apps',
                onDelete: 'SET NULL',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        const subsTable = await queryRunner.getTable('subscriptions');
        if (subsTable) {
            for (const fk of subsTable.foreignKeys) {
                await queryRunner.dropForeignKey('subscriptions', fk);
            }
            await queryRunner.dropTable('subscriptions');
        }

        // 4) Drop apps table & its FK
        const appsTable = await queryRunner.getTable('apps');
        if (appsTable) {
            for (const fk of appsTable.foreignKeys) {
                await queryRunner.dropForeignKey('apps', fk);
            }
            await queryRunner.dropTable('apps');
        }
    }

}
