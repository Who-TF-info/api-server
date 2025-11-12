import { z } from 'zod';
import { baseDtoSchema } from './base';

// User DTO schemas with validation constraints
export const userDtoSchema = baseDtoSchema.extend({
    name: z.string().min(1).max(200), // Name should not exceed 200 characters
    apiKey: z.string().min(32), // API key should be at least 32 characters (common for secure API keys)
    isActive: z.boolean(),
    lastRequestAt: z.date().nullable().optional(),
    totalRequests: z.number(),
});

export const createUserDtoSchema = userDtoSchema.omit({
    id: true,
    created: true,
    updated: true,
});

export const updateUserDtoSchema = userDtoSchema
    .omit({
        id: true,
        created: true,
        updated: true,
    })
    .partial();

export const userQueryDtoSchema = userDtoSchema.partial();

// Export types
export type UserDto = z.infer<typeof userDtoSchema>;
export type CreateUserDto = z.infer<typeof createUserDtoSchema>;
export type UpdateUserDto = z.infer<typeof updateUserDtoSchema>;
export type UserQueryDto = z.infer<typeof userQueryDtoSchema>;

// Validation functions
export const validateCreateUser = (data: unknown): CreateUserDto => createUserDtoSchema.parse(data);
export const validateUpdateUser = (data: unknown): UpdateUserDto => updateUserDtoSchema.parse(data);
export const validateQueryUser = (data: unknown): UserQueryDto => userQueryDtoSchema.parse(data);
