import type { BaseDto } from '@app/database/dtos/BaseDto';
import { DomainNameEntity } from '@app/database/entities';
import { createEntitySchemas } from 'typeorm-zod';

export interface DomainNameDto extends BaseDto {
    name: string;
}

export interface CreateDomainNameDto extends Omit<DomainNameDto, 'id' | 'created' | 'updated'> {}

export interface UpdateDomainNameDto extends Omit<Partial<DomainNameDto>, 'id' | 'created' | 'updated'> {}

export interface DomainNameQueryDto extends Partial<DomainNameDto> {}

export const DomainNameSchemas = createEntitySchemas(DomainNameEntity, undefined);
export const validateCreateDomainName = (data: unknown): CreateDomainNameDto =>
    DomainNameSchemas.create.parse(data) as CreateDomainNameDto;
export const validateUpdateDomainName = (data: unknown): UpdateDomainNameDto =>
    DomainNameSchemas.update.parse(data) as UpdateDomainNameDto;
export const validateQueryDomainName = (data: unknown): DomainNameQueryDto =>
    DomainNameSchemas.query.parse(data) as DomainNameQueryDto;
