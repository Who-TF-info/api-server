import type { BaseDto } from '@app/database/dtos/BaseDto';
import type { DomainNameDto } from '@app/database/dtos/DomainNameDtos';
import type { TopLevelDomainDto } from '@app/database/dtos/TopLevelDomainDtos';
import { DomainEntity } from '@app/database/entities';
import { createEntitySchemas } from 'typeorm-zod';

export interface DomainDto extends BaseDto {
    domainName: DomainNameDto;
    domainNameId: number;
    topLevelDomain: TopLevelDomainDto;
    topLevelDomainId: number;
    fullDomain: string;
    isAvailable: boolean | null | undefined;
    availabilityCheckedAt: Date | null | undefined;
    availabilityMethod: 'dns' | 'porkbun' | 'whois' | null | undefined;
    availabilityTtlExpiresAt: Date | null | undefined;
    whoisData: unknown | null | undefined;
    whoisCheckedAt: Date | null | undefined;
    whoisSource: 'rdap' | 'whois' | null | undefined;
    whoisTtlExpiresAt: Date | null | undefined;
    registrar: string | null | undefined;
    registrationDate: Date | null | undefined;
    expirationDate: Date | null | undefined;
    nameServers: string[] | null | undefined;
    status: string[] | null | undefined;
}

export interface CreateDomainDto
    extends Omit<DomainDto, 'id' | 'created' | 'updated' | 'domainName' | 'topLevelDomain'> {}

export interface UpdateDomainDto
    extends Omit<Partial<DomainDto>, 'id' | 'created' | 'updated' | 'domainName' | 'topLevelDomain'> {}

export interface DomainQueryDto extends Partial<DomainDto> {}

export const DomainSchemas = createEntitySchemas(DomainEntity, undefined);
export const validateCreateDomain = (data: unknown): CreateDomainDto =>
    DomainSchemas.create.parse(data) as CreateDomainDto;
export const validateUpdateDomain = (data: unknown): UpdateDomainDto =>
    DomainSchemas.update.parse(data) as UpdateDomainDto;
export const validateQueryDomain = (data: unknown): DomainQueryDto => DomainSchemas.query.parse(data) as DomainQueryDto;
