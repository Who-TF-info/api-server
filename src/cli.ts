#!/usr/bin/env bun
import 'reflect-metadata';
import { registerImportCommands } from '@app/commands/importCommands';
import { createConfig } from '@app/utils/createConfig';
import { AppLogger, createContainer } from '@app/utils/createContainer';
import { closeDatabase, initializeDatabase } from '@app/utils/createDataSourceOptions';
import { Command } from 'commander';
import { DataSource } from 'typeorm';

const config = createConfig();
const container = createContainer(config);
const logger = container.resolve(AppLogger);
const dataSource = container.resolve(DataSource);

// Set log level from environment or default to info
logger.level = (process.env.LOG_LEVEL as 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal') || 'info';

const program = new Command();

program.name('domains-cli').description('CLI for Domains management and data import').version('0.1.0');

registerImportCommands(program, container);

// Error handling
program.exitOverride();

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
    logger.info({ signal }, 'Received shutdown signal, cleaning up...');
    try {
        await closeDatabase(dataSource, logger);
        await container.dispose?.(); // If container supports disposal
        process.exit(0);
    } catch (error) {
        logger.error({ error }, 'Error during cleanup');
        process.exit(1);
    }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

try {
    // Initialize database before running commands
    await initializeDatabase(dataSource, logger);

    await program.parseAsync(process.argv);

    // Clean shutdown after successful command
    await closeDatabase(dataSource, logger);
    process.exit(0);
} catch (error: unknown) {
    if (
        error instanceof Error &&
        'code' in error &&
        (error.code === 'commander.help' ||
            error.code === 'commander.helpDisplayed' ||
            error.code === 'commander.version')
    ) {
        process.exit(0);
    }

    logger.error({ error }, 'CLI command failed');

    // Attempt to close database on error
    try {
        await closeDatabase(dataSource, logger);
    } catch (dbError) {
        logger.error({ error: dbError }, 'Error closing database after command failure');
    }

    process.exit(1);
}
