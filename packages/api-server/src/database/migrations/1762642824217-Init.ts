import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1762642824217 implements MigrationInterface {
    name = 'Init1762642824217';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`domains\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`deleted_at\` datetime(6) NULL,
                \`domain_name_id\` int NOT NULL,
                \`top_level_domain_id\` int NOT NULL,
                \`full_domain\` varchar(255) NOT NULL,
                \`is_available\` tinyint NULL,
                \`availability_checked_at\` timestamp NULL,
                \`availability_method\` enum ('dns', 'porkbun', 'whois') NULL,
                \`availability_ttl_expires_at\` timestamp NULL,
                \`whois_data\` json NULL,
                \`whois_checked_at\` timestamp NULL,
                \`whois_source\` enum ('rdap', 'whois') NULL,
                \`whois_ttl_expires_at\` timestamp NULL,
                \`registrar\` varchar(255) NULL,
                \`registration_date\` timestamp NULL,
                \`expiration_date\` timestamp NULL,
                \`name_servers\` json NULL,
                \`status\` json NULL,
                INDEX \`domains_created_at\` (\`created_at\`),
                INDEX \`domains_domain_name_id\` (\`domain_name_id\`),
                INDEX \`domains_top_level_domain_id\` (\`top_level_domain_id\`),
                UNIQUE INDEX \`domains_full_domain\` (\`full_domain\`),
                INDEX \`domains_availability_ttl_expires_at\` (\`availability_ttl_expires_at\`),
                INDEX \`domains_whois_ttl_expires_at\` (\`whois_ttl_expires_at\`),
                INDEX \`domains_registrar\` (\`registrar\`),
                INDEX \`domains_expiration_date\` (\`expiration_date\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`requests\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`deleted_at\` datetime(6) NULL,
                \`user_id\` int NOT NULL,
                \`domain_id\` int NOT NULL,
                \`request_type\` enum ('availability', 'whois', 'bulk') NOT NULL,
                \`endpoint\` varchar(255) NOT NULL,
                \`method\` varchar(10) NOT NULL,
                \`status_code\` int NOT NULL,
                \`response_time_ms\` int NOT NULL,
                \`cache_hit\` tinyint NOT NULL DEFAULT 0,
                \`error_code\` varchar(50) NULL,
                \`error_message\` text NULL,
                \`ip_address\` varchar(45) NULL,
                \`user_agent\` text NULL,
                \`requested_at\` timestamp NOT NULL,
                INDEX \`requests_created_at\` (\`created_at\`),
                INDEX \`requests_user_id\` (\`user_id\`),
                INDEX \`requests_domain_id\` (\`domain_id\`),
                INDEX \`requests_request_type\` (\`request_type\`),
                INDEX \`requests_status_code\` (\`status_code\`),
                INDEX \`requests_requested_at\` (\`requested_at\`),
                INDEX \`requests_domain_id_requested_at\` (\`domain_id\`, \`requested_at\`),
                INDEX \`requests_user_id_requested_at\` (\`user_id\`, \`requested_at\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            ALTER TABLE \`settings\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`settings\` CHANGE \`key\` \`key\` varchar(100) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`settings\` CHANGE \`value\` \`value\` text NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`settings\` CHANGE \`description\` \`description\` varchar(255) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`top_level_domains\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`top_level_domains\` CHANGE \`whois_server\` \`whois_server\` varchar(255) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`top_level_domains\` CHANGE \`rdap_server\` \`rdap_server\` varchar(255) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`domain_names\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`users\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`users\` CHANGE \`last_request_at\` \`last_request_at\` date NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`domains\`
            ADD CONSTRAINT \`domains_domain_name_id_fk\` FOREIGN KEY (\`domain_name_id\`) REFERENCES \`domain_names\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`domains\`
            ADD CONSTRAINT \`domains_top_level_domain_id_fk\` FOREIGN KEY (\`top_level_domain_id\`) REFERENCES \`top_level_domains\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`requests\`
            ADD CONSTRAINT \`requests_user_id_fk\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`requests\`
            ADD CONSTRAINT \`requests_domain_id_fk\` FOREIGN KEY (\`domain_id\`) REFERENCES \`domains\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`requests\` DROP FOREIGN KEY \`requests_domain_id_fk\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`requests\` DROP FOREIGN KEY \`requests_user_id_fk\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`domains\` DROP FOREIGN KEY \`domains_top_level_domain_id_fk\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`domains\` DROP FOREIGN KEY \`domains_domain_name_id_fk\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`users\` CHANGE \`last_request_at\` \`last_request_at\` date NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`users\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`domain_names\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`top_level_domains\` CHANGE \`rdap_server\` \`rdap_server\` varchar(255) NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`top_level_domains\` CHANGE \`whois_server\` \`whois_server\` varchar(255) NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`top_level_domains\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`settings\` CHANGE \`description\` \`description\` varchar(255) NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`settings\` CHANGE \`value\` \`value\` text NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`settings\` CHANGE \`key\` \`key\` varchar(100) NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`settings\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            DROP INDEX \`requests_user_id_requested_at\` ON \`requests\`
        `);
        await queryRunner.query(`
            DROP INDEX \`requests_domain_id_requested_at\` ON \`requests\`
        `);
        await queryRunner.query(`
            DROP INDEX \`requests_requested_at\` ON \`requests\`
        `);
        await queryRunner.query(`
            DROP INDEX \`requests_status_code\` ON \`requests\`
        `);
        await queryRunner.query(`
            DROP INDEX \`requests_request_type\` ON \`requests\`
        `);
        await queryRunner.query(`
            DROP INDEX \`requests_domain_id\` ON \`requests\`
        `);
        await queryRunner.query(`
            DROP INDEX \`requests_user_id\` ON \`requests\`
        `);
        await queryRunner.query(`
            DROP INDEX \`requests_created_at\` ON \`requests\`
        `);
        await queryRunner.query(`
            DROP TABLE \`requests\`
        `);
        await queryRunner.query(`
            DROP INDEX \`domains_expiration_date\` ON \`domains\`
        `);
        await queryRunner.query(`
            DROP INDEX \`domains_registrar\` ON \`domains\`
        `);
        await queryRunner.query(`
            DROP INDEX \`domains_whois_ttl_expires_at\` ON \`domains\`
        `);
        await queryRunner.query(`
            DROP INDEX \`domains_availability_ttl_expires_at\` ON \`domains\`
        `);
        await queryRunner.query(`
            DROP INDEX \`domains_full_domain\` ON \`domains\`
        `);
        await queryRunner.query(`
            DROP INDEX \`domains_top_level_domain_id\` ON \`domains\`
        `);
        await queryRunner.query(`
            DROP INDEX \`domains_domain_name_id\` ON \`domains\`
        `);
        await queryRunner.query(`
            DROP INDEX \`domains_created_at\` ON \`domains\`
        `);
        await queryRunner.query(`
            DROP TABLE \`domains\`
        `);
    }
}
