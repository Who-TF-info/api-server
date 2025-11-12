// TypeORM-specific schemas for internal API server use only
import { SettingEntity } from '@app/database/entities/SettingEntity';
import { createEntitySchemas } from 'typeorm-zod';

export const SettingSchemas = createEntitySchemas(SettingEntity, undefined);
