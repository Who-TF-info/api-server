import { describe, expect, it } from 'bun:test';
import type { AppConfig } from '@app/types/AppConfig';
import { createBaseLogger } from '@app/utils/createBaseLogger';

describe('createBaseLogger', () => {
    const developmentConfig = {
        logger: {
            usePretty: true,
            level: 'debug',
        },
    } as AppConfig;
    const productionConfig = {
        logger: {
            usePretty: false,
            level: 'info',
        },
    } as AppConfig;

    const testConfig = {
        logger: {
            usePretty: true,
            level: 'warn',
        },
    } as AppConfig;

    describe('development configuration', () => {
        it('should create pino logger instance with correct level', () => {
            const logger = createBaseLogger(developmentConfig);

            expect(logger).toBeDefined();
            expect(logger.constructor.name).toBe('Pino');
            expect(logger.level).toBe('debug');
        });
    });

    describe('production configuration', () => {
        it('should create pino logger instance with correct level', () => {
            const logger = createBaseLogger(productionConfig);

            expect(logger).toBeDefined();
            expect(logger.constructor.name).toBe('Pino');
            expect(logger.level).toBe('info');
        });
    });

    describe('test configuration', () => {
        it('should create pino logger instance with correct level', () => {
            const logger = createBaseLogger(testConfig);

            expect(logger).toBeDefined();
            expect(logger.constructor.name).toBe('Pino');
            expect(logger.level).toBe('warn');
        });
    });
});
