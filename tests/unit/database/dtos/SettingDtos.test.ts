import { describe, expect, it } from 'bun:test';
import { validateCreateSetting, validateQuerySetting, validateUpdateSetting } from '@app/database/dtos/SettingDtos';

describe('SettingDtos', () => {
    describe('validateCreateSetting', () => {
        it('should pass with valid complete data', () => {
            const validData = {
                key: 'app.name',
                value: 'Who-TF API',
                description: 'Application name displayed in responses',
            };

            const result = validateCreateSetting(validData);
            expect(result.key).toBe('app.name');
            expect(result.value).toBe('Who-TF API');
            expect(result.description).toBe('Application name displayed in responses');
        });

        it('should pass with various key formats', () => {
            const validKeys = [
                'simple',
                'app.name',
                'feature.whois.enabled',
                'cache_ttl_seconds',
                'MAX_REQUESTS_PER_MINUTE',
                'setting-with-dashes',
                'setting123',
            ];

            for (const key of validKeys) {
                const validData = {
                    key,
                    value: 'test-value',
                };

                const result = validateCreateSetting(validData);
                expect(result.key).toBe(key);
            }
        });

        it('should fail with missing required key field', () => {
            const invalidData = {
                value: 'some value',
                description: 'some description',
            };

            expect(() => validateCreateSetting(invalidData)).toThrow();
        });

        it('should fail with non-string key', () => {
            const invalidData = {
                key: 123,
                value: 'some value',
            };

            expect(() => validateCreateSetting(invalidData)).toThrow();
        });

        it('should fail with non-string value when provided', () => {
            const invalidData = {
                key: 'test.key',
                value: 123,
            };

            expect(() => validateCreateSetting(invalidData)).toThrow();
        });
    });

    describe('validateUpdateSetting', () => {
        it('should pass with valid partial update data', () => {
            const validData = {
                value: 'Updated App Name',
                description: 'Updated description',
            };

            const result = validateUpdateSetting(validData);
            expect(result.value).toBe('Updated App Name');
            expect(result.description).toBe('Updated description');
        });

        it('should pass with single field update', () => {
            const validData = {
                value: 'new-value',
            };

            const result = validateUpdateSetting(validData);
            expect(result.value).toBe('new-value');
        });

        it('should pass with empty update object', () => {
            const validData = {};

            const result = validateUpdateSetting(validData);
            expect(result).toEqual({});
        });

        it('should fail with non-string key', () => {
            const invalidData = {
                key: 123,
                value: 'updated value',
            };

            expect(() => validateUpdateSetting(invalidData)).toThrow();
        });
    });

    describe('validateQuerySetting', () => {
        it('should pass with empty query', () => {
            const result = validateQuerySetting({});
            expect(result).toEqual({});
        });

        it('should pass with partial query data', () => {
            const validData = {
                key: 'app.name',
            };

            const result = validateQuerySetting(validData);
            expect(result.key).toBe('app.name');
        });

        it('should pass with valid query fields', () => {
            const validData = {
                key: 'app.version',
                value: '1.0.0',
                description: 'Application version',
            };

            const result = validateQuerySetting(validData);
            expect(result.key).toBe('app.version');
            expect(result.value).toBe('1.0.0');
            expect(result.description).toBe('Application version');
        });

        it('should fail with invalid field types', () => {
            const invalidData = {
                key: 123,
            };

            expect(() => validateQuerySetting(invalidData)).toThrow();
        });

        it('should fail with invalid value type', () => {
            const invalidData = {
                value: 123,
            };

            expect(() => validateQuerySetting(invalidData)).toThrow();
        });
    });
});
