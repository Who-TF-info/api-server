import { InflectionNamingStrategy } from '@app/database/core/naming-strategy/InflectionNamingStrategy';
import type { AppConfig } from '@app/types/AppConfig';
import { createBaseLogger } from '@app/utils/createBaseLogger';
import { parseDsnString } from '@app/utils/parseDsnString';
import type { DataSourceOptions } from 'typeorm';
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
        entities: [`${__dirname}/entities/*Entity.{ts,js}`],
        migrations: [`${__dirname}/migrations/*.{ts,js}`],
        migrationsTableName: 'typeorm_migrations',
        namingStrategy: new InflectionNamingStrategy(),
        logger: typeormLogger,
    } as DataSourceOptions;
}
