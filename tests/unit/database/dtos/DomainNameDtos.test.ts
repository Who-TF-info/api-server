import { describe, expect, it } from 'bun:test';
import {
    validateCreateDomainName,
    validateQueryDomainName,
    validateUpdateDomainName,
} from '@app/database/dtos/DomainNameDtos';

describe('DomainNameDtos', () => {
    describe('validateCreateDomainName', () => {
        it('should pass with valid data', () => {
            const validData = {
                name: 'example',
            };

            const result = validateCreateDomainName(validData);
            expect(result.name).toBe('example');
        });

        it('should pass with various domain name formats', () => {
            const validNames = ['google', 'my-domain', 'test123', 'subdomain'];

            for (const name of validNames) {
                const validData = { name };
                const result = validateCreateDomainName(validData);
                expect(result.name).toBe(name);
            }
        });

        it('should fail with missing required name field', () => {
            const invalidData = {};

            expect(() => validateCreateDomainName(invalidData)).toThrow();
        });

        it('should fail with non-string name', () => {
            const invalidData = {
                name: 123,
            };

            expect(() => validateCreateDomainName(invalidData)).toThrow();
        });
    });

    describe('validateUpdateDomainName', () => {
        it('should pass with valid update data', () => {
            const validData = {
                name: 'updated-domain',
            };

            const result = validateUpdateDomainName(validData);
            expect(result.name).toBe('updated-domain');
        });

        it('should pass with empty update object', () => {
            const validData = {};

            const result = validateUpdateDomainName(validData);
            expect(result).toEqual({});
        });

        it('should fail with non-string name', () => {
            const invalidData = {
                name: 123,
            };

            expect(() => validateUpdateDomainName(invalidData)).toThrow();
        });
    });

    describe('validateQueryDomainName', () => {
        it('should pass with empty query', () => {
            const result = validateQueryDomainName({});
            expect(result).toEqual({});
        });

        it('should pass with partial query data', () => {
            const validData = {
                name: 'example',
            };

            const result = validateQueryDomainName(validData);
            expect(result.name).toBe('example');
        });

        it('should pass with valid query fields', () => {
            const validData = {
                id: 1,
                name: 'example',
            };

            const result = validateQueryDomainName(validData);
            expect(result.id).toBe(1);
            expect(result.name).toBe('example');
        });

        it('should fail with invalid field types', () => {
            const invalidData = {
                id: 'not-a-number',
            };

            expect(() => validateQueryDomainName(invalidData)).toThrow();
        });
    });
});
