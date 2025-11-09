import { appContainer } from '@app/config';
import { closeDatabase, initializeDatabase } from '@app/utils/createDataSourceOptions';
import type { DeepPartial } from 'typeorm';
import { DataSource } from 'typeorm';

class IntegrationTestHelperClass {
    private dataSource: DataSource | null = null;

    async setup(): Promise<DataSource> {
        if (!this.dataSource) {
            this.dataSource = appContainer.resolve(DataSource);
            await initializeDatabase(this.dataSource);
        }
        return this.dataSource;
    }

    async cleanup(): Promise<void> {
        if (this.dataSource?.isInitialized) {
            await closeDatabase(this.dataSource);
            this.dataSource = null;
        }
    }

    async resetTestData(): Promise<void> {
        const dataSource = await this.setup();

        // Get all table names from metadata (instead of hardcoding)
        const tableNames = dataSource.entityMetadatas.map((metadata) => metadata.tableName).reverse(); // Reverse for proper deletion order

        // Use transaction for atomic cleanup
        await dataSource.transaction(async (manager) => {
            // Database-agnostic foreign key handling
            const isMySQL = dataSource.options.type === 'mysql';
            const isPostgres = dataSource.options.type === 'postgres';

            if (isMySQL) {
                await manager.query('SET FOREIGN_KEY_CHECKS = 0');
            }

            try {
                for (const tableName of tableNames) {
                    if (isPostgres) {
                        await manager.query(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`);
                    } else {
                        await manager.query(`TRUNCATE TABLE \`${tableName}\``);
                    }
                }
            } finally {
                if (isMySQL) {
                    await manager.query('SET FOREIGN_KEY_CHECKS = 1');
                }
            }
        });
    }

    /**
     * Create test data with proper typing and relationships
     */
    async createTestData<T>(entityClass: new () => T, data: DeepPartial<T>): Promise<T> {
        const dataSource = await this.setup();
        const repository = dataSource.getRepository(entityClass);

        // Create and save entity with type assertions to work around TypeORM's complex generics
        // biome-ignore lint/suspicious/noExplicitAny: TypeORM repository requires any for flexible entity creation
        const entity = repository.create(data as any);
        // biome-ignore lint/suspicious/noExplicitAny: TypeORM repository save method has complex overloads
        const savedEntity = await repository.save(entity as any);

        return savedEntity as T;
    }
}

export const integrationTestHelper = new IntegrationTestHelperClass();
