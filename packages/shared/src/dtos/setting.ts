import { z } from 'zod';

// Setting DTO schemas (Settings don't inherit from BaseDto)
export const settingDtoSchema = z.object({
    key: z.string(),
    value: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    updated: z.date(),
});

export const createSettingDtoSchema = settingDtoSchema.omit({
    updated: true,
});

export const updateSettingDtoSchema = settingDtoSchema.partial();

export const settingQueryDtoSchema = settingDtoSchema.partial();

// Export types
export type SettingDto = z.infer<typeof settingDtoSchema>;
export type CreateSettingDto = z.infer<typeof createSettingDtoSchema>;
export type UpdateSettingDto = z.infer<typeof updateSettingDtoSchema>;
export type SettingQueryDto = z.infer<typeof settingQueryDtoSchema>;

// Validation functions
export const validateCreateSetting = (data: unknown): CreateSettingDto => createSettingDtoSchema.parse(data);
export const validateUpdateSetting = (data: unknown): UpdateSettingDto => updateSettingDtoSchema.parse(data);
export const validateQuerySetting = (data: unknown): SettingQueryDto => settingQueryDtoSchema.parse(data);
