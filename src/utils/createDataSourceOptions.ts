import { InflectionNamingStrategy } from '@app/database/core/naming-strategy/InflectionNamingStrategy';
import type { AppConfig } from '@app/types/AppConfig';
import { createBaseLogger } from '@app/utils/createBaseLogger';
import { parseDsnString } from '@app/utils/parseDsnString';
import type { DataSource, DataSourceOptions } from 'typeorm';
import { TypeOrmPinoLogger } from 'typeorm-pino-logger';

export function createDataSourceOptions(config: AppConfig): DataSourceOptions {
    const typeormLogger = new TypeOrmPinoLogger(createBaseLogger(config), {
        logQueries: false,
        logSchemaOperations: false,
        messageFilter: (_message, type) => type === 'general2',
    });
    const parsedUrlConfigs = parseDsnString(config.database.url);
    return {
        ...parsedUrlConfigs,
        entities: [`${__dirname}/../database/entities/*Entity.{ts,js}`],
        migrations: [`${__dirname}/../database/migrations/*.{ts,js}`],
        migrationsTableName: 'typeorm_migrations',
        namingStrategy: new InflectionNamingStrategy(),
        logger: typeormLogger,
    } as DataSourceOptions;
}

/**
 * Initialize and return a database connection
 * Apps should use this with their own configuration
 */
export async function initializeDatabase(ds: DataSource): Promise<DataSource> {
    try {
        if (!ds.isInitialized) {
            await ds.initialize();
            console.log(`✅ Database connection initialized (${ds.options.database})`);
        }
        return ds;
    } catch (error) {
        console.error('❌ Error during database initialization:', error);
        throw error;
    }
}

/**
 * Gracefully close database connection
 */
export async function closeDatabase(ds: DataSource): Promise<void> {
    try {
        if (ds.isInitialized) {
            await ds.destroy();
            console.log(`✅ Database connection closed (${ds.options.database})`);
        }
    } catch (error) {
        console.error('❌ Error closing database connection:', error);
        throw error;
    }
}
