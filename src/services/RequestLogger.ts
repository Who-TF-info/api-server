import type { QueryDeepPartialEntity } from '@app/database/core/types';
import { DomainNameRepoService } from '@app/database/db-service/DomainNameRepoService';
import { DomainRepoService } from '@app/database/db-service/DomainRepoService';
import { RequestRepoService } from '@app/database/db-service/RequestRepoService';
import { TopLevelDomainRepoService } from '@app/database/db-service/TopLevelDomainRepoService';
import type { CreateRequestDto } from '@app/database/dtos';
import type {
    DomainEntity,
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
    protected domainsRepo: DomainRepoService;
    protected domainNamesRepo: DomainNameRepoService;
    protected tldsRepo: TopLevelDomainRepoService;

    constructor(
        @inject(AppLogger) logger: Logger,
        @inject(Keyv) cache: Keyv,
        @inject(RequestRepoService) requestsRepo: RequestRepoService,
        @inject(DomainRepoService) domainsRepo: DomainRepoService,
        @inject(DomainNameRepoService) domainNamesRepo: DomainNameRepoService,
        @inject(TopLevelDomainRepoService) tldsRepo: TopLevelDomainRepoService
    ) {
        super(logger, cache);
        this.requestsRepo = requestsRepo;
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
        extraction: DomainExtractionInfo,
        whoisData: WhoisData | null,
        requestType: 'availability' | 'whois' | 'bulk' = 'whois',
        statusCode: number = 200,
        errorCode?: string,
        errorMessage?: string,
        cacheHit: boolean = false
    ): Promise<RequestEntity> {
        const startTime = context.get('requestStartTime') || Date.now();
        const responseTimeMs = Date.now() - startTime;

        // Create or update domain entities only if extraction is valid and has valid TLD
        let domainEntityId: number | null = null;
        if (extraction.isValid && this.isValidTldFormat(extraction.tld)) {
            try {
                const domainNameEntity = await this.upsertDomainName(extraction.domainName);
                const tldEntity = await this.upsertTld(extraction.tld);
                const domainEntity = await this.upsertDomain(domainNameEntity, tldEntity, whoisData);
                domainEntityId = domainEntity.id;
            } catch (error) {
                // Log error but continue with request logging without domain reference
                this.logger.warn(
                    {
                        error: error instanceof Error ? error.message : 'Unknown error',
                        domainName: extraction.domainName,
                        tld: extraction.tld,
                    },
                    'Failed to create domain entities, logging request without domain reference'
                );
            }
        }

        // Extract client information
        const ipAddress = this.extractClientIP(context);
        const userAgent = context.req.header('user-agent') || null;
        const requestId = context.get('requestId') as string;

        // Create request record
        const requestData: CreateRequestDto = {
            userId: user.id,
            domainId: domainEntityId,
            requestType,
            endpoint: context.req.path,
            method: context.req.method,
            statusCode,
            responseTimeMs,
            cacheHit,
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
        this.logger.debug(
            { requestId, domainId: domainEntityId, responseTimeMs, statusCode },
            'Request logged successfully'
        );

        return requestEntity;
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
