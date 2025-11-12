import { z } from 'zod';
import { baseDtoSchema } from './base';
import { domainNameDtoSchema } from './domain-name';
import { topLevelDomainDtoSchema } from './top-level-domain';

// Domain DTO schemas
export const domainDtoSchema = baseDtoSchema.extend({
    domainName: domainNameDtoSchema,
    domainNameId: z.number(),
    topLevelDomain: topLevelDomainDtoSchema,
    topLevelDomainId: z.number(),
    fullDomain: z.string(),
    isAvailable: z.boolean().nullable().optional(),
    availabilityCheckedAt: z.date().nullable().optional(),
    availabilityMethod: z.enum(['dns', 'porkbun', 'whois']).nullable().optional(),
    availabilityTtlExpiresAt: z.date().nullable().optional(),
    whoisData: z.unknown().nullable().optional(),
    whoisCheckedAt: z.date().nullable().optional(),
    whoisSource: z.enum(['rdap', 'whois']).nullable().optional(),
    whoisTtlExpiresAt: z.date().nullable().optional(),
    registrar: z.string().nullable().optional(),
    registrationDate: z.date().nullable().optional(),
    expirationDate: z.date().nullable().optional(),
    nameServers: z.array(z.string()).nullable().optional(),
    status: z.array(z.string()).nullable().optional(),
});

export const createDomainDtoSchema = domainDtoSchema.omit({
    id: true,
    created: true,
    updated: true,
    domainName: true,
    topLevelDomain: true,
});

export const updateDomainDtoSchema = domainDtoSchema
    .omit({
        id: true,
        created: true,
        updated: true,
        domainName: true,
        topLevelDomain: true,
    })
    .partial();

export const domainQueryDtoSchema = domainDtoSchema.partial();

// Export types
export type DomainDto = z.infer<typeof domainDtoSchema>;
export type CreateDomainDto = z.infer<typeof createDomainDtoSchema>;
export type UpdateDomainDto = z.infer<typeof updateDomainDtoSchema>;
export type DomainQueryDto = z.infer<typeof domainQueryDtoSchema>;

// Validation functions
export const validateCreateDomain = (data: unknown): CreateDomainDto => createDomainDtoSchema.parse(data);
export const validateUpdateDomain = (data: unknown): UpdateDomainDto => updateDomainDtoSchema.parse(data);
export const validateQueryDomain = (data: unknown): DomainQueryDto => domainQueryDtoSchema.parse(data);
