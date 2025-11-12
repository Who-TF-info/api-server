import { z } from 'zod';
import { baseDtoSchema } from './base';

// Top level domain DTO schemas
export const topLevelDomainDtoSchema = baseDtoSchema.extend({
    tld: z.string().max(63),
    type: z.enum(['generic', 'country-code', 'sponsored', 'infrastructure']),
    whoisServer: z.string().nullable().optional(),
    rdapServer: z.string().nullable().optional(),
    isActive: z.boolean(),
});

export const createTopLevelDomainDtoSchema = topLevelDomainDtoSchema.omit({
    id: true,
    created: true,
    updated: true,
});

export const updateTopLevelDomainDtoSchema = topLevelDomainDtoSchema
    .omit({
        id: true,
        created: true,
        updated: true,
    })
    .partial();

export const topLevelDomainQueryDtoSchema = topLevelDomainDtoSchema.partial();

// Export types
export type TopLevelDomainDto = z.infer<typeof topLevelDomainDtoSchema>;
export type CreateTopLevelDomainDto = z.infer<typeof createTopLevelDomainDtoSchema>;
export type UpdateTopLevelDomainDto = z.infer<typeof updateTopLevelDomainDtoSchema>;
export type TopLevelDomainQueryDto = z.infer<typeof topLevelDomainQueryDtoSchema>;

// Validation functions
export const validateCreateTopLevelDomain = (data: unknown): CreateTopLevelDomainDto =>
    createTopLevelDomainDtoSchema.parse(data);
export const validateUpdateTopLevelDomain = (data: unknown): UpdateTopLevelDomainDto =>
    updateTopLevelDomainDtoSchema.parse(data);
export const validateQueryTopLevelDomain = (data: unknown): TopLevelDomainQueryDto =>
    topLevelDomainQueryDtoSchema.parse(data);
