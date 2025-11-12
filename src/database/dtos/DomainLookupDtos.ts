import type { BaseDto } from '@app/database/dtos/BaseDto';
import type { DomainDto } from '@app/database/dtos/DomainDtos';
import type { RequestDto } from '@app/database/dtos/RequestDtos';
import { DomainLookupEntity } from '@app/database/entities';
import { createEntitySchemas } from 'typeorm-zod';

export interface DomainLookupDto extends BaseDto {
    request: RequestDto;
    requestId: number;
    domain?: DomainDto | null;
    domainId?: number | null;
    domainName: string;
    lookupType: 'availability' | 'whois';
    success: boolean;
    cacheHit: boolean;
    processingTimeMs: number;
    errorCode?: string | null;
    errorMessage?: string | null;
    whoisData?: Record<string, unknown> | null;
    isAvailable?: boolean | null;
}

export interface CreateDomainLookupDto
    extends Omit<DomainLookupDto, 'id' | 'created' | 'updated' | 'request' | 'domain'> {}

export interface UpdateDomainLookupDto
    extends Omit<Partial<DomainLookupDto>, 'id' | 'created' | 'updated' | 'request' | 'domain'> {}

export interface DomainLookupQueryDto extends Partial<DomainLookupDto> {}

export const DomainLookupSchemas = createEntitySchemas(DomainLookupEntity, undefined);
export const validateCreateDomainLookup = (data: unknown): CreateDomainLookupDto =>
    DomainLookupSchemas.create.parse(data) as CreateDomainLookupDto;
export const validateUpdateDomainLookup = (data: unknown): UpdateDomainLookupDto =>
    DomainLookupSchemas.update.parse(data) as UpdateDomainLookupDto;
export const validateQueryDomainLookup = (data: unknown): DomainLookupQueryDto =>
    DomainLookupSchemas.query.parse(data) as DomainLookupQueryDto;
