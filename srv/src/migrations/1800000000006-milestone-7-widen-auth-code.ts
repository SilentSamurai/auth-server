import {MigrationInterface, QueryRunner, TableColumn} from "typeorm";

export class Milestone7WidenAuthCode1800000000006 implements MigrationInterface {
    name = 'Milestone7WidenAuthCode1800000000006'

    // Authorization codes moved from a 6-digit OTP to 32 random bytes
    // (43 chars base64url), which no longer fits the original VARCHAR(16).
    // Existing rows are short-lived (5 min TTL) and widening is non-destructive,
    // so no data migration is needed.
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.changeColumn("auth_code", "code", new TableColumn({
            name: "code",
            type: "VARCHAR",
            length: "64",
            isPrimary: true,
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Codes longer than the old limit cannot be represented after the
        // rollback; drop them rather than let the narrowing fail.
        await queryRunner.query(`DELETE FROM auth_code`);
        await queryRunner.changeColumn("auth_code", "code", new TableColumn({
            name: "code",
            type: "VARCHAR",
            length: "16",
            isPrimary: true,
        }));
    }
}
