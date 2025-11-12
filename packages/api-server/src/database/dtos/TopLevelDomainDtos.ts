// TypeORM-specific schemas for internal API server use only
import { TopLevelDomainEntity } from '@app/database/entities/TopLevelDomainEntity';
import { createEntitySchemas } from 'typeorm-zod';

export const TopLevelDomainSchemas = createEntitySchemas(TopLevelDomainEntity, undefined);
export const validateCreateTopLevelDomain = (data: unknown) => TopLevelDomainSchemas.create.parse(data);
export const validateUpdateTopLevelDomain = (data: unknown) => TopLevelDomainSchemas.update.parse(data);
export const validateQueryTopLevelDomain = (data: unknown) => TopLevelDomainSchemas.query.parse(data);
