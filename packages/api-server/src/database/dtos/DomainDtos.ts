// TypeORM-specific schemas for internal API server use only
import { DomainEntity } from '@app/database/entities/DomainEntity';
import { createEntitySchemas } from 'typeorm-zod';

export const DomainSchemas = createEntitySchemas(DomainEntity, undefined);
export const validateCreateDomain = (data: unknown) => DomainSchemas.create.parse(data);
export const validateUpdateDomain = (data: unknown) => DomainSchemas.update.parse(data);
export const validateQueryDomain = (data: unknown) => DomainSchemas.query.parse(data);
