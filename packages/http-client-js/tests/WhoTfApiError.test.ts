import { describe, expect, it } from 'bun:test';
import type { ErrorResponse } from '@who-tf-info/shared';
import { WhoTfApiError } from '../src';

describe('WhoTfApiError', () => {
    it('should create error with basic information', () => {
        const errorResponse: ErrorResponse = {
            success: false,
            error: 'Test error message',
        };

        const error = new WhoTfApiError(errorResponse, 400);

        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('WhoTfApiError');
        expect(error.message).toBe('Test error message');
        expect(error.status).toBe(400);
        expect(error.code).toBeUndefined();
        expect(error.details).toBeUndefined();
        expect(error.requestId).toBeUndefined();
    });

    it('should create error with all optional fields', () => {
        const errorResponse: ErrorResponse = {
            success: false,
            error: 'Detailed error message',
            code: 'VALIDATION_ERROR',
            details: {
                field: 'domain',
                issue: 'invalid format',
            },
            requestId: 'req_abc123',
        };

        const error = new WhoTfApiError(errorResponse, 422);

        expect(error.message).toBe('Detailed error message');
        expect(error.status).toBe(422);
        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.details).toEqual({
            field: 'domain',
            issue: 'invalid format',
        });
        expect(error.requestId).toBe('req_abc123');
    });

    it('should preserve error stack trace', () => {
        const errorResponse: ErrorResponse = {
            success: false,
            error: 'Stack trace test',
        };

        const error = new WhoTfApiError(errorResponse, 500);

        expect(error.stack).toContain('WhoTfApiError');
        expect(error.stack).toContain('Stack trace test');
    });

    it('should be instanceof Error and WhoTfApiError', () => {
        const errorResponse: ErrorResponse = {
            success: false,
            error: 'Type check test',
        };

        const error = new WhoTfApiError(errorResponse, 404);

        expect(error instanceof Error).toBe(true);
        expect(error instanceof WhoTfApiError).toBe(true);
    });

    it('should handle empty details object', () => {
        const errorResponse: ErrorResponse = {
            success: false,
            error: 'Empty details test',
            details: {},
        };

        const error = new WhoTfApiError(errorResponse, 400);

        expect(error.details).toEqual({});
    });

    it('should handle complex details object', () => {
        const complexDetails = {
            validation: {
                domains: ['invalid1', 'invalid2'],
                errors: [
                    { field: 'domain[0]', message: 'Invalid TLD' },
                    { field: 'domain[1]', message: 'Too long' },
                ],
            },
            metadata: {
                timestamp: '2023-01-01T00:00:00Z',
                version: 'v1.2.3',
            },
        };

        const errorResponse: ErrorResponse = {
            success: false,
            error: 'Complex validation error',
            details: complexDetails,
        };

        const error = new WhoTfApiError(errorResponse, 400);

        expect(error.details).toEqual(complexDetails);
    });
});
