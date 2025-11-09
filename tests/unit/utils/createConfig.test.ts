import { describe, expect, it } from 'bun:test';
import type { AppConfig } from '@app/types/AppConfig';
import { createConfig } from '@app/utils/createConfig';
import type { DeepPartial } from 'typeorm';

describe('createConfig', () => {
    describe('config creation logic', () => {
        it('should create valid AppConfig object with no overrides', () => {
            const config = createConfig();

            expect(config).toBeDefined();
            expect(config.nodeEnv).toBeDefined();
            expect(config.http).toBeDefined();
            expect(config.logger).toBeDefined();
            expect(config.porkbun).toBeDefined();
        });

        it('should merge overrides with default config', () => {
            const overrides: DeepPartial<AppConfig> = {
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
                    cacheUrl: 'invalid-url', // Invalid URL format
                });
            }).toThrow();
        });

        it('should parse HTTP_CORS_ORIGINS as a comma-separated string into an array of trimmed strings', () => {
            // Store original value to restore later
            const originalValue = Bun.env.HTTP_CORS_ORIGINS;

            try {
                Bun.env.HTTP_CORS_ORIGINS = 'https://foo.com, https://bar.com ,https://baz.com';
                const config = createConfig();

                expect(config.http.corsOrigins).toEqual(['https://foo.com', 'https://bar.com', 'https://baz.com']);
            } finally {
                // Restore original value
                if (originalValue !== undefined) {
                    Bun.env.HTTP_CORS_ORIGINS = originalValue;
                } else {
                    delete Bun.env.HTTP_CORS_ORIGINS;
                }
            }
        });

        it('should filter out empty strings from CORS origins', () => {
            const originalValue = Bun.env.HTTP_CORS_ORIGINS;

            try {
                Bun.env.HTTP_CORS_ORIGINS = 'https://foo.com,, https://bar.com, ,';
                const config = createConfig();

                expect(config.http.corsOrigins).toEqual(['https://foo.com', 'https://bar.com']);
            } finally {
                if (originalValue !== undefined) {
                    Bun.env.HTTP_CORS_ORIGINS = originalValue;
                } else {
                    delete Bun.env.HTTP_CORS_ORIGINS;
                }
            }
        });

        it('should return empty array when HTTP_CORS_ORIGINS is not set', () => {
            const originalValue = Bun.env.HTTP_CORS_ORIGINS;

            try {
                delete Bun.env.HTTP_CORS_ORIGINS;
                const config = createConfig();

                expect(config.http.corsOrigins).toEqual([]);
            } finally {
                if (originalValue !== undefined) {
                    Bun.env.HTTP_CORS_ORIGINS = originalValue;
                }
            }
        });
    });
});
