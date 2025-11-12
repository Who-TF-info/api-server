import { describe, expect, it } from 'bun:test';
import { validateCreateDomain, validateQueryDomain, validateUpdateDomain } from '@who-tf-info/shared';

describe('DomainDtos', () => {
    describe('validateCreateDomain', () => {
        // Note: validateCreateDomain expects entity instances for domainName/topLevelDomain relationships
        // which makes it difficult to test in isolation. In practice, these would be
        // populated by the ORM when creating relationships.

        it('should fail with missing required domainNameId', () => {
            const invalidData = {
                topLevelDomainId: 1,
                fullDomain: 'example.com',
            };

            expect(() => validateCreateDomain(invalidData)).toThrow();
        });

        it('should fail with missing required topLevelDomainId', () => {
            const invalidData = {
                domainNameId: 1,
                fullDomain: 'example.com',
            };

            expect(() => validateCreateDomain(invalidData)).toThrow();
        });

        it('should fail with missing required fullDomain', () => {
            const invalidData = {
                domainNameId: 1,
                topLevelDomainId: 1,
            };

            expect(() => validateCreateDomain(invalidData)).toThrow();
        });

        it('should fail with invalid availability method', () => {
            const invalidData = {
                domainNameId: 1,
                topLevelDomainId: 1,
                fullDomain: 'example.com',
                availabilityMethod: 'invalid-method',
            };

            expect(() => validateCreateDomain(invalidData)).toThrow();
        });

        it('should fail with invalid whois source', () => {
            const invalidData = {
                domainNameId: 1,
                topLevelDomainId: 1,
                fullDomain: 'example.com',
                whoisSource: 'invalid-source',
            };

            expect(() => validateCreateDomain(invalidData)).toThrow();
        });
    });

    describe('validateUpdateDomain', () => {
        it('should pass with valid partial update data', () => {
            const validData = {
                isAvailable: false,
                registrar: 'Updated Registrar',
            };

            const result = validateUpdateDomain(validData);
            expect(result.isAvailable).toBe(false);
            expect(result.registrar).toBe('Updated Registrar');
        });

        it('should pass with single field update', () => {
            const validData = {
                isAvailable: true,
            };

            const result = validateUpdateDomain(validData);
            expect(result.isAvailable).toBe(true);
        });

        it('should pass with empty update object', () => {
            const validData = {};

            const result = validateUpdateDomain(validData);
            expect(result).toEqual({});
        });

        it('should fail with invalid availability method', () => {
            const invalidData = {
                availabilityMethod: 'invalid-method',
            };

            expect(() => validateUpdateDomain(invalidData)).toThrow();
        });
    });

    describe('validateQueryDomain', () => {
        it('should pass with empty query', () => {
            const result = validateQueryDomain({});
            expect(result).toEqual({});
        });

        it('should pass with partial query data', () => {
            const validData = {
                isAvailable: true,
                registrar: 'GoDaddy',
            };

            const result = validateQueryDomain(validData);
            expect(result.isAvailable).toBe(true);
            expect(result.registrar).toBe('GoDaddy');
        });

        it('should pass with relationship data', () => {
            const validData = {
                domainNameId: 1,
                topLevelDomainId: 2,
                fullDomain: 'example.com',
            };

            const result = validateQueryDomain(validData);
            expect(result.domainNameId).toBe(1);
            expect(result.topLevelDomainId).toBe(2);
            expect(result.fullDomain).toBe('example.com');
        });

        it('should fail with invalid field types', () => {
            const invalidData = {
                isAvailable: 'not-boolean',
            };

            expect(() => validateQueryDomain(invalidData)).toThrow();
        });

        it('should fail with invalid availability method', () => {
            const invalidData = {
                availabilityMethod: 'invalid-method',
            };

            expect(() => validateQueryDomain(invalidData)).toThrow();
        });
    });
});
