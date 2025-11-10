import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Auth1762807387685 implements MigrationInterface {
    name = 'Auth1762807387685';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`domain_names\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL
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
            ALTER TABLE \`domains\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`domains\` CHANGE \`is_available\` \`is_available\` tinyint NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`domains\` CHANGE \`availability_checked_at\` \`availability_checked_at\` timestamp NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`domains\` CHANGE \`availability_method\` \`availability_method\` enum ('dns', 'porkbun', 'whois') NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`domains\` CHANGE \`availability_ttl_expires_at\` \`availability_ttl_expires_at\` timestamp NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`domains\` DROP COLUMN \`whois_data\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`domains\`
            ADD \`whois_data\` json NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`domains\` CHANGE \`whois_checked_at\` \`whois_checked_at\` timestamp NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`domains\` CHANGE \`whois_source\` \`whois_source\` enum ('rdap', 'whois') NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`domains\` CHANGE \`whois_ttl_expires_at\` \`whois_ttl_expires_at\` timestamp NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`domains\` CHANGE \`registrar\` \`registrar\` varchar(255) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`domains\` CHANGE \`registration_date\` \`registration_date\` timestamp NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`domains\` CHANGE \`expiration_date\` \`expiration_date\` timestamp NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`domains\` DROP COLUMN \`name_servers\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`domains\`
            ADD \`name_servers\` json NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`domains\` DROP COLUMN \`status\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`domains\`
            ADD \`status\` json NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`users\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`users\` CHANGE \`last_request_at\` \`last_request_at\` date NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`users\` CHANGE \`total_requests\` \`total_requests\` int NOT NULL DEFAULT '0'
        `);
        await queryRunner.query(`
            ALTER TABLE \`requests\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`requests\` CHANGE \`error_code\` \`error_code\` varchar(50) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`requests\` CHANGE \`error_message\` \`error_message\` text NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`requests\` CHANGE \`ip_address\` \`ip_address\` varchar(45) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`requests\` CHANGE \`user_agent\` \`user_agent\` text NULL
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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
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
            ALTER TABLE \`requests\` CHANGE \`user_agent\` \`user_agent\` text NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`requests\` CHANGE \`ip_address\` \`ip_address\` varchar(45) NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`requests\` CHANGE \`error_message\` \`error_message\` text NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`requests\` CHANGE \`error_code\` \`error_code\` varchar(50) NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`requests\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`users\` CHANGE \`total_requests\` \`total_requests\` int NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`users\` CHANGE \`last_request_at\` \`last_request_at\` date NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`users\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`domains\` DROP COLUMN \`status\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`domains\`
            ADD \`status\` longtext COLLATE "utf8mb4_bin" NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`domains\` DROP COLUMN \`name_servers\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`domains\`
            ADD \`name_servers\` longtext COLLATE "utf8mb4_bin" NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`domains\` CHANGE \`expiration_date\` \`expiration_date\` timestamp NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`domains\` CHANGE \`registration_date\` \`registration_date\` timestamp NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`domains\` CHANGE \`registrar\` \`registrar\` varchar(255) NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`domains\` CHANGE \`whois_ttl_expires_at\` \`whois_ttl_expires_at\` timestamp NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`domains\` CHANGE \`whois_source\` \`whois_source\` enum ('rdap', 'whois') NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`domains\` CHANGE \`whois_checked_at\` \`whois_checked_at\` timestamp NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`domains\` DROP COLUMN \`whois_data\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`domains\`
            ADD \`whois_data\` longtext COLLATE "utf8mb4_bin" NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`domains\` CHANGE \`availability_ttl_expires_at\` \`availability_ttl_expires_at\` timestamp NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`domains\` CHANGE \`availability_method\` \`availability_method\` enum ('dns', 'porkbun', 'whois') NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`domains\` CHANGE \`availability_checked_at\` \`availability_checked_at\` timestamp NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`domains\` CHANGE \`is_available\` \`is_available\` tinyint NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`domains\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL DEFAULT 'NULL'
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
            ALTER TABLE \`domain_names\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL DEFAULT 'NULL'
        `);
    }
}
