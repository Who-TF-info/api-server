import type { QueryDeepPartialEntity } from '@app/database/core/types';
import { DomainLookupRepoService } from '@app/database/db-service/DomainLookupRepoService';
import { DomainNameRepoService } from '@app/database/db-service/DomainNameRepoService';
import { DomainRepoService } from '@app/database/db-service/DomainRepoService';
import { RequestRepoService } from '@app/database/db-service/RequestRepoService';
import { TopLevelDomainRepoService } from '@app/database/db-service/TopLevelDomainRepoService';
import type { CreateDomainLookupDto, CreateRequestDto } from '@app/database/dtos';
import type {
    DomainEntity,
    DomainLookupEntity,
    DomainNameEntity,
    RequestEntity,
    TopLevelDomainEntity,
    UserEntity,
} from '@app/database/entities';
import { BaseCacheableService } from '@app/services/core/BaseCacheableService';
import type { DomainExtractionInfo } from '@app/services/TldExtractor';
import type { AppContext } from '@app/types/HonoEnvContext';
import type { WhoisData } from '@app/types/WhoisData';
import { AppLogger } from '@app/utils/createContainer';
import Keyv from '@keyvhq/core';
import type { Logger } from 'pino';
import { inject, singleton } from 'tsyringe';

@singleton()
export class RequestLogger extends BaseCacheableService {
    protected requestsRepo: RequestRepoService;
    protected domainLookupsRepo: DomainLookupRepoService;
    protected domainsRepo: DomainRepoService;
    protected domainNamesRepo: DomainNameRepoService;
    protected tldsRepo: TopLevelDomainRepoService;

    constructor(
        @inject(AppLogger) logger: Logger,
        @inject(Keyv) cache: Keyv,
        @inject(RequestRepoService) requestsRepo: RequestRepoService,
        @inject(DomainLookupRepoService) domainLookupsRepo: DomainLookupRepoService,
        @inject(DomainRepoService) domainsRepo: DomainRepoService,
        @inject(DomainNameRepoService) domainNamesRepo: DomainNameRepoService,
        @inject(TopLevelDomainRepoService) tldsRepo: TopLevelDomainRepoService
    ) {
        super(logger, cache);
        this.requestsRepo = requestsRepo;
        this.domainLookupsRepo = domainLookupsRepo;
        this.domainsRepo = domainsRepo;
        this.domainNamesRepo = domainNamesRepo;
        this.tldsRepo = tldsRepo;
    }

    protected extractClientIP(context: AppContext): string | null {
        // Check common headers for client IP
        const forwardedFor = context.req.header('x-forwarded-for');
        if (forwardedFor) {
            return forwardedFor.split(',')[0]?.trim() || null;
        }

        const realIP = context.req.header('x-real-ip');
        if (realIP) {
            return realIP;
        }

        const cfConnectingIP = context.req.header('cf-connecting-ip');
        if (cfConnectingIP) {
            return cfConnectingIP;
        }

        // TODO: Extract from request socket if available in Hono
        return null;
    }

    async saveRequest(
        context: AppContext,
        user: UserEntity,
        requestType: 'availability' | 'whois' | 'bulk' = 'whois',
        statusCode: number = 200,
        errorCode?: string,
        errorMessage?: string
    ): Promise<RequestEntity> {
        const startTime = context.get('requestStartTime') || Date.now();
        const responseTimeMs = Date.now() - startTime;

        // Extract client information
        const ipAddress = this.extractClientIP(context);
        const userAgent = context.req.header('user-agent') || null;

        // Create request record
        const requestData: CreateRequestDto = {
            userId: user.id,
            requestType,
            endpoint: context.req.path,
            method: context.req.method,
            statusCode,
            responseTimeMs,
            errorCode: errorCode || null,
            errorMessage: errorMessage || null,
            ipAddress,
            userAgent,
            requestedAt: new Date(),
        };

        const requestEntity = await this.requestsRepo.save(this.requestsRepo.repository.create(requestData));
        if (!requestEntity) {
            throw new Error('Failed to create request entity');
        }

        const requestId = context.get('requestId') as string;
        this.logger.debug({ requestId, responseTimeMs, statusCode }, 'Request logged successfully');

        return requestEntity;
    }

    async saveDomainLookup(
        requestEntity: RequestEntity,
        extraction: DomainExtractionInfo,
        whoisData: WhoisData | null,
        lookupType: 'availability' | 'whois',
        success: boolean,
        processingTimeMs: number,
        cacheHit: boolean = false,
        errorCode?: string,
        errorMessage?: string,
        isAvailable?: boolean
    ): Promise<DomainLookupEntity> {
        // Create or update domain entities only if extraction is valid and has valid TLD
        let domainEntityId: number | null = null;
        if (extraction.isValid && this.isValidTldFormat(extraction.tld)) {
            try {
                const domainNameEntity = await this.upsertDomainName(extraction.domainName);
                const tldEntity = await this.upsertTld(extraction.tld);
                const domainEntity = await this.upsertDomain(domainNameEntity, tldEntity, whoisData);
                domainEntityId = domainEntity.id;
            } catch (error) {
                // Log error but continue with domain lookup logging without domain reference
                this.logger.warn(
                    {
                        error: error instanceof Error ? error.message : 'Unknown error',
                        domainName: extraction.domainName,
                        tld: extraction.tld,
                    },
                    'Failed to create domain entities, logging lookup without domain reference'
                );
            }
        }

        // Create domain lookup record
        const lookupData: CreateDomainLookupDto = {
            requestId: requestEntity.id,
            domainId: domainEntityId,
            domainName: `${extraction.domainName}.${extraction.tld}`,
            lookupType,
            success,
            cacheHit,
            processingTimeMs,
            errorCode: errorCode || null,
            errorMessage: errorMessage || null,
            whoisData: whoisData ? JSON.parse(JSON.stringify(whoisData)) : null,
            isAvailable: isAvailable || null,
        };

        const lookupEntity = await this.domainLookupsRepo.save(this.domainLookupsRepo.repository.create(lookupData));
        if (!lookupEntity) {
            throw new Error('Failed to create domain lookup entity');
        }

        this.logger.debug(
            {
                requestId: requestEntity.id,
                domainName: lookupData.domainName,
                lookupType,
                success,
                cacheHit,
                processingTimeMs,
            },
            'Domain lookup logged successfully'
        );

        return lookupEntity;
    }

    async saveDomainLookups(
        requestEntity: RequestEntity,
        lookupData: Array<{
            extraction: DomainExtractionInfo;
            whoisData: WhoisData | null;
            lookupType: 'availability' | 'whois';
            success: boolean;
            processingTimeMs: number;
            cacheHit?: boolean;
            errorCode?: string;
            errorMessage?: string;
            isAvailable?: boolean;
        }>
    ): Promise<DomainLookupEntity[]> {
        if (lookupData.length === 0) {
            return [];
        }

        const lookupEntities: DomainLookupEntity[] = [];

        // Process each lookup individually to handle domain entity creation
        for (const lookup of lookupData) {
            const entity = await this.saveDomainLookup(
                requestEntity,
                lookup.extraction,
                lookup.whoisData,
                lookup.lookupType,
                lookup.success,
                lookup.processingTimeMs,
                lookup.cacheHit || false,
                lookup.errorCode,
                lookup.errorMessage,
                lookup.isAvailable
            );
            lookupEntities.push(entity);
        }

        this.logger.info(
            {
                requestId: requestEntity.id,
                lookupCount: lookupEntities.length,
                successCount: lookupEntities.filter((l) => l.success).length,
            },
            'Bulk domain lookups logged successfully'
        );

        return lookupEntities;
    }

    protected upsertDomainName(domainName: string): Promise<DomainNameEntity> {
        return this.domainNamesRepo.upsert(
            {
                name: domainName.toLowerCase().trim(),
            },
            ['name']
        );
    }

    protected upsertTld(tld: string): Promise<TopLevelDomainEntity> {
        return this.tldsRepo.upsert(
            {
                tld: tld.toLowerCase().trim(),
            },
            ['tld']
        );
    }

    protected async upsertDomain(
        domainName: DomainNameEntity,
        tld: TopLevelDomainEntity,
        whoisData?: WhoisData | null
    ): Promise<DomainEntity> {
        const fullDomain = `${domainName.name}.${tld.tld}`;
        const now = new Date();

        const domainData: QueryDeepPartialEntity<DomainEntity> = {
            domainNameId: domainName.id,
            topLevelDomainId: tld.id,
            fullDomain,
        };

        // Update WHOIS data if provided
        if (whoisData) {
            domainData.whoisData = JSON.parse(JSON.stringify(whoisData));
            domainData.whoisCheckedAt = now;
            domainData.whoisSource = whoisData.source || 'rdap';
            domainData.whoisTtlExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

            // Extract parsed fields
            if (whoisData.registrar) domainData.registrar = whoisData.registrar;
            if (whoisData.creationDate) domainData.registrationDate = whoisData.creationDate;
            if (whoisData.expirationDate) domainData.expirationDate = whoisData.expirationDate;
            if (whoisData.nameServers) domainData.nameServers = whoisData.nameServers;
            if (whoisData.status) domainData.status = whoisData.status;
        }

        return this.domainsRepo.upsert(domainData, ['fullDomain']);
    }

    protected isValidTldFormat(tld: string): boolean {
        // Basic TLD validation - must be alphabetic, 2-63 characters, no special chars except hyphens
        if (!tld || tld.length < 2 || tld.length > 63) {
            return false;
        }

        // TLD should contain only letters, numbers, and hyphens
        // Cannot start or end with hyphen
        const tldRegex = /^[a-zA-Z]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
        return tldRegex.test(tld);
    }
}
