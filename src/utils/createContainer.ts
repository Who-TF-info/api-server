import type { AppConfig } from '@app/types/AppConfig';
import { createBaseLogger } from '@app/utils/createBaseLogger';
import { createCacheStore } from '@app/utils/createCacheStore';
import Keyv from '@keyvhq/core';
import pino, { type Logger } from 'pino';
import { PorkbunApiClient } from 'porkbun-api-client';
import { KeyvTagManager, TaggedKeyv } from 'tagged-keyv-wrapper';
import { container, type DependencyContainer, type InjectionToken, instanceCachingFactory } from 'tsyringe';

// Simple string-based injection tokens for consistency
export const AppLogger: InjectionToken<Logger> = 'Logger';
export const AppCache: InjectionToken<TaggedKeyv> = 'Cache';

// Utility function to reduce DI registration boilerplate
const registerFactory = <T>(
    container: DependencyContainer,
    token: InjectionToken<T>,
    factory: (container: DependencyContainer) => T
) => {
    container.register<T>(token, {
        useFactory: instanceCachingFactory<T>(factory),
    });
};

export const createContainer = (config: AppConfig): DependencyContainer => {
    const appContainer = container.createChildContainer();

    // Register logger with error handling
    registerFactory(appContainer, AppLogger, () => {
        try {
            return createBaseLogger(config);
        } catch (error) {
            console.error('Failed to create logger, falling back to console:', error);
            // Create a console wrapper that implements Logger interface
            return pino();
        }
    });

    // Register base Keyv instance
    registerFactory(appContainer, Keyv, () => createCacheStore(config.cacheUrl));

    // Register tagged cache wrapper
    registerFactory(appContainer, AppCache, (container) => {
        const keyv = container.resolve(Keyv);
        const tagManager = new KeyvTagManager(keyv);
        return new TaggedKeyv(keyv, tagManager);
    });

    // Register PorkBun API client
    registerFactory(
        appContainer,
        PorkbunApiClient,
        () =>
            new PorkbunApiClient({
                apiKey: config.porkbun.apikey,
                secretApiKey: config.porkbun.secretApiKey,
            })
    );

    return appContainer;
};
