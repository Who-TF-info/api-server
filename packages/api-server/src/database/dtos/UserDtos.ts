// TypeORM-specific schemas for internal API server use only
import { UserEntity } from '@app/database/entities/UserEntity';
import { createEntitySchemas } from 'typeorm-zod';

export const UserSchemas = createEntitySchemas(UserEntity, undefined);
