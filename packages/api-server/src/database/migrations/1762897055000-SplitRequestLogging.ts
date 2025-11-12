import type { MigrationInterface, QueryRunner } from 'typeorm';

export class SplitRequestLogging1762897055000 implements MigrationInterface {
    name = 'SplitRequestLogging1762897055000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create the new domain_lookups table
        await queryRunner.query(`
            CREATE TABLE \`domain_lookups\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`deleted_at\` datetime(6) NULL,
                \`request_id\` int NOT NULL,
                \`domain_id\` int NULL,
                \`domain_name\` varchar(255) NOT NULL,
                \`lookup_type\` enum ('availability', 'whois') NOT NULL,
                \`success\` tinyint NOT NULL,
                \`cache_hit\` tinyint NOT NULL DEFAULT 0,
                \`processing_time_ms\` int NOT NULL,
                \`error_code\` varchar(50) NULL,
                \`error_message\` text NULL,
                \`whois_data\` json NULL,
                \`is_available\` tinyint NULL,
                INDEX \`IDX_DOMAIN_LOOKUPS_LOOKUP_TYPE_SUCCESS\` (\`lookup_type\`, \`success\`),
                INDEX \`IDX_DOMAIN_LOOKUPS_DOMAIN_NAME\` (\`domain_name\`),
                INDEX \`IDX_DOMAIN_LOOKUPS_SUCCESS\` (\`success\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        // Remove domain-specific fields from requests table
        await queryRunner.query(`
            ALTER TABLE \`requests\` DROP FOREIGN KEY \`requests_domain_id_fk\`
        `);

        await queryRunner.query(`
            DROP INDEX \`requests_domain_id_requested_at\` ON \`requests\`
        `);

        await queryRunner.query(`
            ALTER TABLE \`requests\` DROP COLUMN \`domain_id\`
        `);

        await queryRunner.query(`
            ALTER TABLE \`requests\` DROP COLUMN \`cache_hit\`
        `);

        // Add foreign key constraint for domain_lookups -> requests
        await queryRunner.query(`
            ALTER TABLE \`domain_lookups\`
            ADD CONSTRAINT \`FK_DOMAIN_LOOKUPS_REQUEST_ID\` FOREIGN KEY (\`request_id\`) REFERENCES \`requests\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Add foreign key constraint for domain_lookups -> domains (nullable)
        await queryRunner.query(`
            ALTER TABLE \`domain_lookups\`
            ADD CONSTRAINT \`FK_DOMAIN_LOOKUPS_DOMAIN_ID\` FOREIGN KEY (\`domain_id\`) REFERENCES \`domains\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove foreign key constraints
        await queryRunner.query(`
            ALTER TABLE \`domain_lookups\` DROP FOREIGN KEY \`FK_DOMAIN_LOOKUPS_DOMAIN_ID\`
        `);

        await queryRunner.query(`
            ALTER TABLE \`domain_lookups\` DROP FOREIGN KEY \`FK_DOMAIN_LOOKUPS_REQUEST_ID\`
        `);

        // Add back domain-specific fields to requests table
        await queryRunner.query(`
            ALTER TABLE \`requests\` ADD \`domain_id\` int NULL
        `);

        await queryRunner.query(`
            ALTER TABLE \`requests\` ADD \`cache_hit\` tinyint NOT NULL DEFAULT 0
        `);

        // Recreate the index and foreign key for requests.domain_id
        await queryRunner.query(`
            CREATE INDEX \`requests_domain_id_requested_at\` ON \`requests\` (\`domain_id\`, \`requested_at\`)
        `);

        await queryRunner.query(`
            ALTER TABLE \`requests\`
            ADD CONSTRAINT \`requests_domain_id_fk\` FOREIGN KEY (\`domain_id\`) REFERENCES \`domains\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        // Drop the domain_lookups table
        await queryRunner.query(`
            DROP TABLE \`domain_lookups\`
        `);
    }
}
