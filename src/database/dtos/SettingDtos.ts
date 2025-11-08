import { SettingEntity } from '@app/database/entities';
import { createEntitySchemas } from 'typeorm-zod';

export interface SettingDto {
    key: string;
    value: string | null | undefined;
    description: string | null | undefined;
    updated: Date;
}

export interface CreateSettingDto extends Omit<SettingDto, 'updated'> {}

export interface UpdateSettingDto extends Partial<SettingDto> {}

export interface SettingQueryDto extends Partial<SettingDto> {}

export const SettingSchemas = createEntitySchemas(SettingEntity, undefined);
export const validateCreateSetting = (data: unknown): CreateSettingDto =>
    SettingSchemas.create.parse(data) as CreateSettingDto;
export const validateUpdateSetting = (data: unknown): UpdateSettingDto =>
    SettingSchemas.update.parse(data) as UpdateSettingDto;
export const validateQuerySetting = (data: unknown): SettingQueryDto =>
    SettingSchemas.query.parse(data) as SettingQueryDto;
