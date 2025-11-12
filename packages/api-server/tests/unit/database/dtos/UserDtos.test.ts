import { describe, expect, it } from 'bun:test';
import { type CreateUserDto, validateCreateUser, validateQueryUser, validateUpdateUser } from '@who-tf-info/shared';

describe('UserDtos', () => {
    describe('validateCreateUser', () => {
        it('should pass with valid complete data', () => {
            const validData: CreateUserDto = {
                name: 'John Doe',
                apiKey: 'abcdef1234567890123456789012345678901234',
                isActive: true,
                lastRequestAt: new Date(),
                totalRequests: 0,
            };

            const result = validateCreateUser(validData);
            expect(result.name).toBe('John Doe');
            expect(result.apiKey).toBe('abcdef1234567890123456789012345678901234');
            expect(result.isActive).toBe(true);
            expect(result.totalRequests).toBe(0);
        });

        it('should fail with missing name field', () => {
            const invalidData = {
                apiKey: 'abcdef1234567890123456789012345678901234',
                isActive: true,
                totalRequests: 0,
            };

            expect(() => validateCreateUser(invalidData)).toThrow();
        });

        it('should fail with missing apiKey field', () => {
            const invalidData = {
                name: 'John Doe',
                isActive: true,
                totalRequests: 0,
            };

            expect(() => validateCreateUser(invalidData)).toThrow();
        });

        it('should fail with apiKey too short', () => {
            const invalidData = {
                name: 'John Doe',
                apiKey: 'short',
                isActive: true,
                totalRequests: 0,
            };

            expect(() => validateCreateUser(invalidData)).toThrow();
        });

        it('should fail with name too long', () => {
            const invalidData = {
                name: 'a'.repeat(201),
                apiKey: 'abcdef1234567890123456789012345678901234',
                isActive: true,
                totalRequests: 0,
            };

            expect(() => validateCreateUser(invalidData)).toThrow();
        });

        it('should fail with non-boolean isActive', () => {
            const invalidData = {
                name: 'John Doe',
                apiKey: 'abcdef1234567890123456789012345678901234',
                isActive: 'true',
                totalRequests: 0,
            };

            expect(() => validateCreateUser(invalidData)).toThrow();
        });
    });

    describe('validateUpdateUser', () => {
        it('should pass with valid partial update data', () => {
            const validData = {
                name: 'Updated Name',
                isActive: false,
            };

            const result = validateUpdateUser(validData);
            expect(result.name).toBe('Updated Name');
            expect(result.isActive).toBe(false);
        });

        it('should pass with single field update', () => {
            const validData = {
                isActive: true,
            };

            const result = validateUpdateUser(validData);
            expect(result.isActive).toBe(true);
        });

        it('should pass with empty update object', () => {
            const validData = {};

            const result = validateUpdateUser(validData);
            expect(result).toEqual({});
        });

        it('should fail with invalid field type', () => {
            const invalidData = {
                isActive: 'not-boolean',
            };

            expect(() => validateUpdateUser(invalidData)).toThrow();
        });

        it('should fail with invalid apiKey length', () => {
            const invalidData = {
                apiKey: 'too-short',
            };

            expect(() => validateUpdateUser(invalidData)).toThrow();
        });
    });

    describe('validateQueryUser', () => {
        it('should pass with empty query', () => {
            const result = validateQueryUser({});
            expect(result).toEqual({});
        });

        it('should pass with partial query data', () => {
            const validData = {
                isActive: true,
                name: 'John',
            };

            const result = validateQueryUser(validData);
            expect(result.isActive).toBe(true);
            expect(result.name).toBe('John');
        });

        it('should pass with valid query fields', () => {
            const validData = {
                id: 1,
                name: 'John Doe',
                apiKey: 'abcdef1234567890123456789012345678901234',
                isActive: true,
                totalRequests: 10,
            };

            const result = validateQueryUser(validData);
            expect(result.id).toBe(1);
            expect(result.name).toBe('John Doe');
            expect(result.isActive).toBe(true);
            expect(result.totalRequests).toBe(10);
        });

        it('should fail with invalid field types', () => {
            const invalidData = {
                isActive: 'not-boolean',
            };

            expect(() => validateQueryUser(invalidData)).toThrow();
        });

        it('should fail with invalid apiKey length', () => {
            const invalidData = {
                apiKey: 'too-short',
            };

            expect(() => validateQueryUser(invalidData)).toThrow();
        });
    });
});
