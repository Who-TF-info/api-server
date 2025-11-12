// TypeORM-specific schemas for internal API server use only
import { DomainNameEntity } from '@app/database/entities/DomainNameEntity';
import { createEntitySchemas } from 'typeorm-zod';

export const DomainNameSchemas = createEntitySchemas(DomainNameEntity, undefined);
export const validateCreateDomainName = (data: unknown) => DomainNameSchemas.create.parse(data);
export const validateUpdateDomainName = (data: unknown) => DomainNameSchemas.update.parse(data);
export const validateQueryDomainName = (data: unknown) => DomainNameSchemas.query.parse(data);
