import { describe, expect, it, spyOn } from 'bun:test';
import type { AppConfig } from '@app/types/AppConfig';
import { NodeEnv } from '@app/types/node';
import { createPorkbunClient } from '@app/utils/createPorkbunClient';

describe('createPorkbunClient', () => {
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

    describe('client creation logic', () => {
        it('should create PorkbunApiClient when credentials are provided', () => {
            const client = createPorkbunClient(baseConfig);

            expect(client).toBeDefined();
            expect(client?.constructor.name).toBe('PorkbunApiClient');
        });

        it('should return null when credentials are missing', () => {
            const configWithoutCreds = {
                ...baseConfig,
                porkbun: {
                    apikey: '',
                    secretApiKey: '',
                },
            };

            const consoleWarnSpy = spyOn(console, 'warn').mockImplementation(() => {});

            const client = createPorkbunClient(configWithoutCreds);

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'PorkBun API credentials not configured, PorkBun client will not be available'
            );
            expect(client).toBeNull();

            consoleWarnSpy.mockRestore();
        });

        it('should return null when partial credentials are missing', () => {
            const configMissingSecret = {
                ...baseConfig,
                porkbun: {
                    apikey: 'test-key',
                    secretApiKey: '',
                },
            };

            const consoleWarnSpy = spyOn(console, 'warn').mockImplementation(() => {});

            const client = createPorkbunClient(configMissingSecret);

            expect(client).toBeNull();
            expect(consoleWarnSpy).toHaveBeenCalled();

            consoleWarnSpy.mockRestore();
        });
    });
});
