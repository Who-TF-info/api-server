import { TopLevelDomainRepoService } from '@app/database/db-service/TopLevelDomainRepoService';
import type { TopLevelDomainEntity } from '@app/database/entities';
import { BaseCacheableService } from '@app/services/core/BaseCacheableService';
import { RdapClient } from '@app/services/rdap/RdapClient';
import { TldExtractor } from '@app/services/TldExtractor';
import { WhoisClient } from '@app/services/whois/WhoisClient';
import type { WhoisData } from '@app/types/WhoisData';
import { AppLogger } from '@app/utils/createContainer';
import Keyv from '@keyvhq/core';
import type { Logger } from 'pino';
import { inject, singleton } from 'tsyringe';

@singleton()
export class TldResolver extends BaseCacheableService {
    protected cacheTTL = 60 * 10 * 1000; // 10 minutes for domain lookups
    protected tldRepo: TopLevelDomainRepoService;
    protected rdapClient: RdapClient;
    protected whoisClient: WhoisClient;
    protected tldExtractor: TldExtractor;

    constructor(
        @inject(TopLevelDomainRepoService) tldRepo: TopLevelDomainRepoService,
        @inject(TldExtractor) tldExtractor: TldExtractor,
        @inject(RdapClient) rdapClient: RdapClient,
        @inject(WhoisClient) whoisClient: WhoisClient,
        @inject(AppLogger) logger: Logger,
        @inject(Keyv) cache: Keyv
    ) {
        super(logger, cache);
        this.tldRepo = tldRepo;
        this.tldExtractor = tldExtractor;
        this.rdapClient = rdapClient;
        this.whoisClient = whoisClient;
    }

    async getWhoisData(domain: string | unknown): Promise<WhoisData | null> {
        // Input validation
        if (!domain || typeof domain !== 'string' || domain.trim().length === 0) {
            this.logger.warn({ domain }, 'Invalid domain parameter provided');
            return null;
        }

        const normalizedDomain = domain.toLowerCase().trim();
        const cacheKey = `TldResolver::getWhoisData::${normalizedDomain}`;

        return this.rememberCache(
            cacheKey,
            async () => {
                this.logger.debug({ domain: normalizedDomain }, 'Starting WHOIS data lookup');

                // 1. Extract TLD from domain
                const tld = await this.tldExtractor.extract(normalizedDomain);
                this.logger.debug({ domain: normalizedDomain, tld }, 'Extracted TLD');

                // 2. Check if valid
                const isValid = await this.tldExtractor.isValidTld(tld);
                if (!isValid) {
                    this.logger.warn({ domain: normalizedDomain, tld }, 'Invalid TLD');
                    return null;
                }

                // 3. Fetch TopLevelDomainEntity
                const tldEntity = await this.getTldEntity(tld);
                if (!tldEntity) {
                    this.logger.warn({ domain: normalizedDomain, tld }, 'TLD entity not found in database');
                    return null;
                }

                this.logger.debug(
                    {
                        domain: normalizedDomain,
                        tld,
                        rdapServer: tldEntity.rdapServer,
                        whoisServer: tldEntity.whoisServer,
                    },
                    'Retrieved TLD entity'
                );

                // 4. Try RDAP first if available
                if (tldEntity.rdapServer) {
                    try {
                        this.logger.debug(
                            { domain: normalizedDomain, rdapServer: tldEntity.rdapServer },
                            'Attempting RDAP query'
                        );
                        const rdapResult = await this.rdapClient.query(normalizedDomain, tldEntity.rdapServer);
                        if (rdapResult) {
                            this.logger.info(
                                { domain: normalizedDomain, source: 'rdap' },
                                'Successfully retrieved WHOIS data via RDAP'
                            );
                            return rdapResult;
                        }
                        this.logger.debug(
                            { domain: normalizedDomain, rdapServer: tldEntity.rdapServer },
                            'RDAP query returned null result'
                        );
                    } catch (error) {
                        this.logger.error(
                            {
                                error: error instanceof Error ? error.message : String(error),
                                domain: normalizedDomain,
                                rdapServer: tldEntity.rdapServer,
                            },
                            'RDAP query failed, attempting WHOIS fallback'
                        );
                    }
                }

                // 5. Fallback to WHOIS if available
                if (tldEntity.whoisServer) {
                    try {
                        this.logger.debug(
                            { domain: normalizedDomain, whoisServer: tldEntity.whoisServer },
                            'Attempting WHOIS query'
                        );
                        const whoisResult = await this.whoisClient.query(normalizedDomain, tldEntity.whoisServer);
                        if (whoisResult) {
                            this.logger.info(
                                { domain: normalizedDomain, source: 'whois' },
                                'Successfully retrieved WHOIS data via WHOIS'
                            );
                            return whoisResult;
                        }
                        this.logger.debug(
                            { domain: normalizedDomain, whoisServer: tldEntity.whoisServer },
                            'WHOIS query returned null result'
                        );
                    } catch (error) {
                        this.logger.error(
                            {
                                error: error instanceof Error ? error.message : String(error),
                                domain: normalizedDomain,
                                whoisServer: tldEntity.whoisServer,
                            },
                            'WHOIS query failed'
                        );
                    }
                }

                // 6. No servers available or all failed
                if (!tldEntity.rdapServer && !tldEntity.whoisServer) {
                    this.logger.warn({ domain: normalizedDomain, tld }, 'No RDAP or WHOIS servers configured for TLD');
                } else {
                    this.logger.warn({ domain: normalizedDomain, tld }, 'All available lookup methods failed');
                }

                return null;
            },
            this.cacheTTL
        );
    }

    protected async getTldEntity(tld: string): Promise<TopLevelDomainEntity | null> {
        const cacheKey = `TldResolver::getTldEntity::${tld}`;
        return this.rememberCache(
            cacheKey,
            async () => {
                this.logger.debug({ tld }, 'Fetching TLD entity from database');
                const tldEntity = await this.tldRepo.findOne({ tld });
                this.logger.debug({ tld, found: !!tldEntity }, 'TLD entity database query completed');
                return tldEntity;
            },
            3600000 // 1 hour in milliseconds
        );
    }
}
