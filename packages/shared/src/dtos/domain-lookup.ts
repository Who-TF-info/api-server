import { z } from 'zod';
import { baseDtoSchema } from './base';
import { domainDtoSchema } from './domain';
import { requestDtoSchema } from './request';

// Domain lookup DTO schemas
export const domainLookupDtoSchema = baseDtoSchema.extend({
    request: requestDtoSchema,
    requestId: z.number(),
    domain: domainDtoSchema.nullable().optional(),
    domainId: z.number().nullable().optional(),
    domainName: z.string(),
    lookupType: z.enum(['availability', 'whois']),
    success: z.boolean(),
    cacheHit: z.boolean(),
    processingTimeMs: z.number(),
    errorCode: z.string().nullable().optional(),
    errorMessage: z.string().nullable().optional(),
    whoisData: z.record(z.unknown()).nullable().optional(),
    isAvailable: z.boolean().nullable().optional(),
});

export const createDomainLookupDtoSchema = domainLookupDtoSchema.omit({
    id: true,
    created: true,
    updated: true,
    request: true,
    domain: true,
});

export const updateDomainLookupDtoSchema = domainLookupDtoSchema
    .omit({
        id: true,
        created: true,
        updated: true,
        request: true,
        domain: true,
    })
    .partial();

export const domainLookupQueryDtoSchema = domainLookupDtoSchema.partial();

// Export types
export type DomainLookupDto = z.infer<typeof domainLookupDtoSchema>;
export type CreateDomainLookupDto = z.infer<typeof createDomainLookupDtoSchema>;
export type UpdateDomainLookupDto = z.infer<typeof updateDomainLookupDtoSchema>;
export type DomainLookupQueryDto = z.infer<typeof domainLookupQueryDtoSchema>;

// Validation functions
export const validateCreateDomainLookup = (data: unknown): CreateDomainLookupDto =>
    createDomainLookupDtoSchema.parse(data);
export const validateUpdateDomainLookup = (data: unknown): UpdateDomainLookupDto =>
    updateDomainLookupDtoSchema.parse(data);
export const validateQueryDomainLookup = (data: unknown): DomainLookupQueryDto =>
    domainLookupQueryDtoSchema.parse(data);
