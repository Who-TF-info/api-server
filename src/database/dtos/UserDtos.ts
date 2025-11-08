import type { BaseDto } from '@app/database/dtos/BaseDto';
import { UserEntity } from '@app/database/entities';
import { createEntitySchemas } from 'typeorm-zod';

export interface UserDto extends BaseDto {
    name: string;
    apiKey: string;
    isActive: boolean;
    lastRequestAt: Date | null | undefined;
    totalRequests: number;
}

export interface CreateUserDto extends Omit<UserDto, 'id' | 'created' | 'updated'> {}

export interface UpdateUserDto extends Omit<Partial<UserDto>, 'id' | 'created' | 'updated'> {}

export interface UserQueryDto extends Partial<UserDto> {}

export const UserSchemas = createEntitySchemas(UserEntity, undefined);
export const validateCreateUser = (data: unknown): CreateUserDto => UserSchemas.create.parse(data) as CreateUserDto;
export const validateUpdateUser = (data: unknown): UpdateUserDto => UserSchemas.update.parse(data) as UpdateUserDto;
export const validateQueryUser = (data: unknown): UserQueryDto => UserSchemas.query.parse(data) as UserQueryDto;
