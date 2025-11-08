import { describe, expect, it } from 'bun:test';
import { validateQueryRequest, validateUpdateRequest } from '@app/database/dtos/RequestDtos';

describe('RequestDtos', () => {
    // Note: validateCreateRequest expects entity instances for user/domain relationships
    // which makes it difficult to test in isolation. In practice, these would be
    // populated by the ORM when creating relationships.

    describe('validateUpdateRequest', () => {
        it('should pass with valid partial update data', () => {
            const validData = {
                statusCode: 404,
                errorCode: 'NOT_FOUND',
            };

            const result = validateUpdateRequest(validData);
            expect(result.statusCode).toBe(404);
            expect(result.errorCode).toBe('NOT_FOUND');
        });

        it('should pass with single field update', () => {
            const validData = {
                requestType: 'whois' as const,
            };

            const result = validateUpdateRequest(validData);
            expect(result.requestType).toBe('whois');
        });

        it('should pass with empty update object', () => {
            const validData = {};

            const result = validateUpdateRequest(validData);
            expect(result).toEqual({});
        });

        it('should fail with invalid request type', () => {
            const invalidData = {
                requestType: 'invalid-type',
            };

            expect(() => validateUpdateRequest(invalidData)).toThrow();
        });

        it('should fail with invalid status code type', () => {
            const invalidData = {
                statusCode: 'not-a-number',
            };

            expect(() => validateUpdateRequest(invalidData)).toThrow();
        });
    });

    describe('validateQueryRequest', () => {
        it('should pass with empty query', () => {
            const result = validateQueryRequest({});
            expect(result).toEqual({});
        });

        it('should pass with partial query data', () => {
            const validData = {
                requestType: 'whois' as const,
                statusCode: 200,
                cacheHit: true,
            };

            const result = validateQueryRequest(validData);
            expect(result.requestType).toBe('whois');
            expect(result.statusCode).toBe(200);
            expect(result.cacheHit).toBe(true);
        });

        it('should pass with relationship ids', () => {
            const validData = {
                userId: 1,
                domainId: 2,
            };

            const result = validateQueryRequest(validData);
            expect(result.userId).toBe(1);
            expect(result.domainId).toBe(2);
        });

        it('should pass with error fields', () => {
            const validData = {
                errorCode: 'TIMEOUT',
                errorMessage: 'Request timed out',
            };

            const result = validateQueryRequest(validData);
            expect(result.errorCode).toBe('TIMEOUT');
            expect(result.errorMessage).toBe('Request timed out');
        });

        it('should fail with invalid field types', () => {
            const invalidData = {
                cacheHit: 'not-boolean',
            };

            expect(() => validateQueryRequest(invalidData)).toThrow();
        });

        it('should fail with invalid request type', () => {
            const invalidData = {
                requestType: 'invalid-type',
            };

            expect(() => validateQueryRequest(invalidData)).toThrow();
        });

        it('should fail with invalid status code type', () => {
            const invalidData = {
                statusCode: 'not-a-number',
            };

            expect(() => validateQueryRequest(invalidData)).toThrow();
        });
    });
});
