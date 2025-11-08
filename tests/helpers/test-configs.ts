import type { AppConfig } from '@app/types/AppConfig';
import { NodeEnv } from '@app/types/node';
import { merge } from 'ts-deepmerge';

export const baseConfig: AppConfig = {
    nodeEnv: {
        env: NodeEnv.development,
        isDevelopment: true,
        isTesting: false,
    },
    http: { host: 'localhost', port: 3000 },
    logger: { usePretty: true, level: 'info' },
    cacheUrl: 'redis://localhost:6379',
    porkbun: {
        apikey: 'test-api-key',
        secretApiKey: 'test-secret-key',
    },
    database: {
        url: '',
    },
};

export const developmentConfig: AppConfig = merge(baseConfig, {
    nodeEnv: {
        env: NodeEnv.development,
        isDevelopment: true,
        isTesting: false,
    },
    logger: {
        usePretty: true,
        level: 'debug',
    },
});

export const productionConfig: AppConfig = merge(baseConfig, {
    nodeEnv: {
        env: NodeEnv.production,
        isDevelopment: false,
        isTesting: false,
    },
    logger: {
        usePretty: false,
        level: 'info',
    },
});

export const testConfig: AppConfig = merge(baseConfig, {
    nodeEnv: {
        env: NodeEnv.test,
        isDevelopment: false,
        isTesting: true,
    },
    logger: {
        usePretty: true,
        level: 'warn',
    },
});
