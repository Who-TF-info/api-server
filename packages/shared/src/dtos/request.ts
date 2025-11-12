import { z } from 'zod';
import { baseDtoSchema } from './base';
import { userDtoSchema } from './user';

// Request DTO schemas
export const requestDtoSchema = baseDtoSchema.extend({
    user: userDtoSchema,
    userId: z.number(),
    requestType: z.enum(['availability', 'whois', 'bulk']),
    endpoint: z.string(),
    method: z.string(),
    statusCode: z.number(),
    responseTimeMs: z.number(),
    errorCode: z.string().nullable().optional(),
    errorMessage: z.string().nullable().optional(),
    ipAddress: z.string().nullable().optional(),
    userAgent: z.string().nullable().optional(),
    requestedAt: z.date(),
});

export const createRequestDtoSchema = requestDtoSchema.omit({
    id: true,
    created: true,
    updated: true,
    user: true,
});

export const updateRequestDtoSchema = requestDtoSchema
    .omit({
        id: true,
        created: true,
        updated: true,
        user: true,
    })
    .partial();

export const requestQueryDtoSchema = requestDtoSchema.partial();

// Export types
export type RequestDto = z.infer<typeof requestDtoSchema>;
export type CreateRequestDto = z.infer<typeof createRequestDtoSchema>;
export type UpdateRequestDto = z.infer<typeof updateRequestDtoSchema>;
export type RequestQueryDto = z.infer<typeof requestQueryDtoSchema>;

// Validation functions
export const validateCreateRequest = (data: unknown): CreateRequestDto => createRequestDtoSchema.parse(data);
export const validateUpdateRequest = (data: unknown): UpdateRequestDto => updateRequestDtoSchema.parse(data);
export const validateQueryRequest = (data: unknown): RequestQueryDto => requestQueryDtoSchema.parse(data);
