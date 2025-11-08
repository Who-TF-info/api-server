import type { BaseDto } from '@app/database/dtos/BaseDto';
import type { DomainDto } from '@app/database/dtos/DomainDtos';
import type { UserDto } from '@app/database/dtos/UserDtos';
import { RequestEntity } from '@app/database/entities';
import { createEntitySchemas } from 'typeorm-zod';

export interface RequestDto extends BaseDto {
    user: UserDto;
    userId: number;
    domain: DomainDto;
    domainId: number;
    requestType: 'availability' | 'whois' | 'bulk';
    endpoint: string;
    method: string;
    statusCode: number;
    responseTimeMs: number;
    cacheHit: boolean;
    errorCode: string | null | undefined;
    errorMessage: string | null | undefined;
    ipAddress: string | null | undefined;
    userAgent: string | null | undefined;
    requestedAt: Date;
}

export interface CreateRequestDto extends Omit<RequestDto, 'id' | 'created' | 'updated' | 'user' | 'domain'> {}

export interface UpdateRequestDto extends Omit<Partial<RequestDto>, 'id' | 'created' | 'updated' | 'user' | 'domain'> {}

export interface RequestQueryDto extends Partial<RequestDto> {}

export const RequestSchemas = createEntitySchemas(RequestEntity, undefined);
export const validateCreateRequest = (data: unknown): CreateRequestDto =>
    RequestSchemas.create.parse(data) as CreateRequestDto;
export const validateUpdateRequest = (data: unknown): UpdateRequestDto =>
    RequestSchemas.update.parse(data) as UpdateRequestDto;
export const validateQueryRequest = (data: unknown): RequestQueryDto =>
    RequestSchemas.query.parse(data) as RequestQueryDto;
