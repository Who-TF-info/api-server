import 'reflect-metadata';
import { describe, expect, it } from 'bun:test';
import type { AppConfig } from '@app/types/AppConfig';
import { NodeEnv } from '@app/types/node';
import { AppCache, AppLogger, createContainer } from '@app/utils/createContainer';
import Keyv from '@keyvhq/core';
import { PorkbunApiClient } from 'porkbun-api-client';

describe('createContainer', () => {
    const baseConfig: AppConfig = {
        nodeEnv: {
            env: NodeEnv.development,
            isDevelopment: true,
            isTesting: false,
        },
        http: { host: 'localhost', port: 3000 },
        logger: { usePretty: true, level: 'info' },
        cacheUrl: '',
        porkbun: {
            apikey: 'test-api-key',
            secretApiKey: 'test-secret-key',
        },
    };

    describe('container creation logic', () => {
        it('should create DependencyContainer with registered services', () => {
            const appContainer = createContainer(baseConfig);

            expect(appContainer).toBeDefined();
            expect(typeof appContainer.resolve).toBe('function');

            // Verify core services are registered and can be resolved
            const logger = appContainer.resolve(AppLogger);
            const cache = appContainer.resolve(AppCache);
            const keyv = appContainer.resolve(Keyv);
            const porkbunClient = appContainer.resolve(PorkbunApiClient);

            expect(logger).toBeDefined();
            expect(cache).toBeDefined();
            expect(keyv).toBeDefined();
            expect(porkbunClient).toBeDefined();
        });

        it('should create independent container instances', () => {
            const container1 = createContainer(baseConfig);
            const container2 = createContainer(baseConfig);

            expect(container1).not.toBe(container2);
        });

        it('should handle different config parameters', () => {
            const testConfig: AppConfig = {
                nodeEnv: {
                    env: NodeEnv.test,
                    isDevelopment: false,
                    isTesting: true,
                },
                http: { host: 'localhost', port: 3000 },
                logger: { usePretty: true, level: 'silent' },
                cacheUrl: 'redis://localhost:6379',
                porkbun: {
                    apikey: '',
                    secretApiKey: '',
                },
            };

            const appContainer = createContainer(testConfig);
            expect(appContainer).toBeDefined();

            // Should still create all services even with different config
            const logger = appContainer.resolve(AppLogger);
            const cache = appContainer.resolve(AppCache);
            expect(logger).toBeDefined();
            expect(cache).toBeDefined();
        });
    });
});
