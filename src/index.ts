import { appConfig, appContainer } from '@app/config';
import { AppLogger } from '@app/utils/createContainer';
import { closeDatabase, initializeDatabase } from '@app/utils/createDataSourceOptions';
import { serve } from 'bun';
import { DataSource } from 'typeorm';
import { honoApp } from './http-server';

async function startServer() {
    const dataSource = appContainer.resolve(DataSource);
    const logger = appContainer.resolve(AppLogger);

    // Initialize database connection
    await initializeDatabase(dataSource);
    logger.info('✅ Database connection initialized');

    const { host: hostname, port } = appConfig.http;
    const server = serve({
        port,
        hostname,
        fetch: honoApp.fetch,
    });

    logger.info({ hostname, port }, `HTTP server started at http://${hostname}:${port}`);

    return { server, logger, dataSource };
}

// Start the server
const { server, logger, dataSource } = await startServer();

// Graceful shutdown handling
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await server.stop();
    try {
        await closeDatabase(dataSource);
    } catch (err) {
        logger.error(err as Error, 'Error closing database during shutdown');
    }
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    await server.stop();
    try {
        await closeDatabase(dataSource);
    } catch (err) {
        logger.error(err as Error, 'Error closing database during shutdown');
    }
    process.exit(0);
});
