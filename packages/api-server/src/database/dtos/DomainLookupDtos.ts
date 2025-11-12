// TypeORM-specific schemas for internal API server use only
import { DomainLookupEntity } from '@app/database/entities/DomainLookupEntity';
import { createEntitySchemas } from 'typeorm-zod';

export const DomainLookupSchemas = createEntitySchemas(DomainLookupEntity, undefined);
export const validateCreateDomainLookup = (data: unknown) => DomainLookupSchemas.create.parse(data);
export const validateUpdateDomainLookup = (data: unknown) => DomainLookupSchemas.update.parse(data);
export const validateQueryDomainLookup = (data: unknown) => DomainLookupSchemas.query.parse(data);
