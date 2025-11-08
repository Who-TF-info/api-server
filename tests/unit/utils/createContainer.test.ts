import 'reflect-metadata';
import { describe, expect, it } from 'bun:test';
import { AppCache, AppLogger, createContainer } from '@app/utils/createContainer';
import Keyv from '@keyvhq/core';
import { PorkbunApiClient } from 'porkbun-api-client';
import { developmentConfig, testConfig } from '../../helpers/test-configs';

describe('createContainer', () => {
    describe('container creation logic', () => {
        it('should create DependencyContainer with registered services', () => {
            const appContainer = createContainer(developmentConfig);

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
            const container1 = createContainer(developmentConfig);
            const container2 = createContainer(developmentConfig);

            expect(container1).not.toBe(container2);
        });

        it('should handle different config parameters', () => {
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
