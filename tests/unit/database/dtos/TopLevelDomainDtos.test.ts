import { describe, expect, it } from 'bun:test';
import {
    validateCreateTopLevelDomain,
    validateQueryTopLevelDomain,
    validateUpdateTopLevelDomain,
} from '@app/database/dtos/TopLevelDomainDtos';

describe('TopLevelDomainDtos', () => {
    describe('validateCreateTopLevelDomain', () => {
        it('should pass with valid complete data', () => {
            const validData = {
                tld: 'com',
                type: 'generic' as const,
                whoisServer: 'whois.verisign-grs.com',
                rdapServer: 'https://rdap.verisign.com/com/v1/',
                isActive: true,
            };

            const result = validateCreateTopLevelDomain(validData);
            expect(result.tld).toBe('com');
            expect(result.type).toBe('generic');
            expect(result.isActive).toBe(true);
        });

        it('should pass with null optional fields', () => {
            const validData = {
                tld: 'test',
                type: 'infrastructure' as const,
                whoisServer: null,
                rdapServer: null,
                isActive: false,
            };

            const result = validateCreateTopLevelDomain(validData);
            expect(result.tld).toBe('test');
            expect(result.type).toBe('infrastructure');
            expect(result.isActive).toBe(false);
        });

        it('should fail with missing required tld field', () => {
            const invalidData = {
                type: 'generic',
                isActive: true,
            };

            expect(() => validateCreateTopLevelDomain(invalidData)).toThrow();
        });

        it('should fail with missing required type field', () => {
            const invalidData = {
                tld: 'com',
                isActive: true,
            };

            expect(() => validateCreateTopLevelDomain(invalidData)).toThrow();
        });

        it('should fail with invalid TLD type', () => {
            const invalidData = {
                tld: 'com',
                type: 'invalid-type',
                isActive: true,
            };

            expect(() => validateCreateTopLevelDomain(invalidData)).toThrow();
        });

        it('should fail with TLD that is too long', () => {
            const invalidData = {
                tld: 'a'.repeat(64),
                type: 'generic',
                isActive: true,
            };

            expect(() => validateCreateTopLevelDomain(invalidData)).toThrow();
        });
    });

    describe('validateUpdateTopLevelDomain', () => {
        it('should pass with valid partial update data', () => {
            const validData = {
                tld: 'net',
                isActive: false,
            };

            const result = validateUpdateTopLevelDomain(validData);
            expect(result.tld).toBe('net');
            expect(result.isActive).toBe(false);
        });

        it('should pass with single field update', () => {
            const validData = {
                isActive: true,
            };

            const result = validateUpdateTopLevelDomain(validData);
            expect(result.isActive).toBe(true);
        });

        it('should pass with empty update object', () => {
            const validData = {};

            const result = validateUpdateTopLevelDomain(validData);
            expect(result).toEqual({});
        });

        it('should fail with invalid type value', () => {
            const invalidData = {
                type: 'invalid-type',
            };

            expect(() => validateUpdateTopLevelDomain(invalidData)).toThrow();
        });
    });

    describe('validateQueryTopLevelDomain', () => {
        it('should pass with empty query', () => {
            const result = validateQueryTopLevelDomain({});
            expect(result).toEqual({});
        });

        it('should pass with partial query data', () => {
            const validData = {
                type: 'generic' as const,
                isActive: true,
            };

            const result = validateQueryTopLevelDomain(validData);
            expect(result.type).toBe('generic');
            expect(result.isActive).toBe(true);
        });

        it('should pass with valid query fields', () => {
            const validData = {
                id: 1,
                tld: 'com',
                type: 'generic' as const,
                isActive: true,
            };

            const result = validateQueryTopLevelDomain(validData);
            expect(result.id).toBe(1);
            expect(result.tld).toBe('com');
            expect(result.type).toBe('generic');
            expect(result.isActive).toBe(true);
        });

        it('should fail with invalid field types', () => {
            const invalidData = {
                isActive: 'not-boolean',
            };

            expect(() => validateQueryTopLevelDomain(invalidData)).toThrow();
        });

        it('should fail with invalid type value', () => {
            const invalidData = {
                type: 'invalid-type',
            };

            expect(() => validateQueryTopLevelDomain(invalidData)).toThrow();
        });
    });
});
