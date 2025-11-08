import type { BaseDto } from '@app/database/dtos/BaseDto';
import { TopLevelDomainEntity } from '@app/database/entities';
import { createEntitySchemas } from 'typeorm-zod';

export interface TopLevelDomainDto extends BaseDto {
    tld: string;
    type: 'generic' | 'country-code' | 'sponsored' | 'infrastructure';
    whoisServer: string | null | undefined;
    rdapServer: string | null | undefined;
    isActive: boolean;
}

export interface CreateTopLevelDomainDto extends Omit<TopLevelDomainDto, 'id' | 'created' | 'updated'> {}

export interface UpdateTopLevelDomainDto extends Omit<Partial<TopLevelDomainDto>, 'id' | 'created' | 'updated'> {}

export interface TopLevelDomainQueryDto extends Partial<TopLevelDomainDto> {}

export const TopLevelDomainSchemas = createEntitySchemas(TopLevelDomainEntity, undefined);
export const validateCreateTopLevelDomain = (data: unknown): CreateTopLevelDomainDto =>
    TopLevelDomainSchemas.create.parse(data) as CreateTopLevelDomainDto;
export const validateUpdateTopLevelDomain = (data: unknown): UpdateTopLevelDomainDto =>
    TopLevelDomainSchemas.update.parse(data) as UpdateTopLevelDomainDto;
export const validateQueryTopLevelDomain = (data: unknown): TopLevelDomainQueryDto =>
    TopLevelDomainSchemas.query.parse(data) as TopLevelDomainQueryDto;
