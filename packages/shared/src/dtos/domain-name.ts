import { z } from 'zod';
import { baseDtoSchema } from './base';

// Domain name DTO schemas
export const domainNameDtoSchema = baseDtoSchema.extend({
    name: z.string(),
});

export const createDomainNameDtoSchema = domainNameDtoSchema.omit({
    id: true,
    created: true,
    updated: true,
});

export const updateDomainNameDtoSchema = domainNameDtoSchema
    .omit({
        id: true,
        created: true,
        updated: true,
    })
    .partial();

export const domainNameQueryDtoSchema = domainNameDtoSchema.partial();

// Export types
export type DomainNameDto = z.infer<typeof domainNameDtoSchema>;
export type CreateDomainNameDto = z.infer<typeof createDomainNameDtoSchema>;
export type UpdateDomainNameDto = z.infer<typeof updateDomainNameDtoSchema>;
export type DomainNameQueryDto = z.infer<typeof domainNameQueryDtoSchema>;

// Validation functions
export const validateCreateDomainName = (data: unknown): CreateDomainNameDto => createDomainNameDtoSchema.parse(data);
export const validateUpdateDomainName = (data: unknown): UpdateDomainNameDto => updateDomainNameDtoSchema.parse(data);
export const validateQueryDomainName = (data: unknown): DomainNameQueryDto => domainNameQueryDtoSchema.parse(data);
