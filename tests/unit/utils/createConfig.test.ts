import { describe, expect, it } from 'bun:test';
import type { AppConfig } from '@app/types/AppConfig';
import { createConfig } from '@app/utils/createConfig';

describe('createConfig', () => {
    describe('config creation logic', () => {
        it('should create valid AppConfig object with no overrides', () => {
            const config = createConfig();

            expect(config).toBeDefined();
            expect(config.nodeEnv).toBeDefined();
            expect(config.http).toBeDefined();
            expect(config.logger).toBeDefined();
            expect(typeof config.cacheUrl).toBe('string');
            expect(config.porkbun).toBeDefined();
        });

        it('should merge overrides with default config', () => {
            const overrides: Partial<AppConfig> = {
                http: {
                    port: 9000,
                    host: 'custom-host',
                },
            };

            const config = createConfig(overrides);

            expect(config).toBeDefined();
            expect(config.http.port).toBe(9000);
            expect(config.http.host).toBe('custom-host');
        });

        it('should handle undefined overrides', () => {
            const config = createConfig(undefined);

            expect(config).toBeDefined();
            expect(config.nodeEnv).toBeDefined();
        });

        it('should validate config with schema', () => {
            // Invalid config should throw due to schema validation
            expect(() => {
                createConfig({
                    cacheUrl: 'invalid-url',
                } as Partial<AppConfig>);
            }).toThrow();
        });
    });
});
