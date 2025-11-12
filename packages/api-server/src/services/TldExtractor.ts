import { CacheTTL } from '@app/constants/CacheTTL';
import { TopLevelDomainRepoService } from '@app/database/db-service/TopLevelDomainRepoService';
import { BaseCacheableService } from '@app/services/core/BaseCacheableService';
import { AppLogger } from '@app/utils/createContainer';
import Keyv from '@keyvhq/core';
import type { Logger } from 'pino';
import { inject, singleton } from 'tsyringe';
import { Like } from 'typeorm';

export type DomainExtractionInfo = { domainName: string; tld: string; isValid: boolean };

@singleton()
export class TldExtractor extends BaseCacheableService {
    protected tldRepo: TopLevelDomainRepoService;
    protected cacheTTL = CacheTTL.SECOND_LEVEL_TLDS;

    constructor(
        @inject(TopLevelDomainRepoService) tldRepo: TopLevelDomainRepoService,
        @inject(AppLogger) logger: Logger,
        @inject(Keyv) cache: Keyv
    ) {
        super(logger.child({ module: 'TldExtractor' }), cache);
        this.tldRepo = tldRepo;
    }

    async extract(domain: string): Promise<string> {
        this.logger.debug({ domain }, 'Extracting TLD');

        if (!domain?.trim()) {
            throw new Error('Domain cannot be empty when extracting TLD');
        }

        // Add domain format validation supporting Unicode and punycode (IDNs)
        // Allow Unicode letters, numbers, hyphens, dots, and punycode prefix
        // Disallow spaces and control characters
        const trimmedDomain = domain.trim();
        const punycodePattern = /^xn--[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*$/;
        const unicodePattern = /^[\p{L}\p{N}\-.]+$/u;

        if (!punycodePattern.test(trimmedDomain) && !unicodePattern.test(trimmedDomain)) {
            throw new Error('Invalid domain format: contains invalid characters or unsupported format');
        }

        const normalized = this.normalize(domain);
        const parts = normalized.split('.');

        if (parts.length < 2) {
            throw new Error('Invalid domain format');
        }

        const commonSecondLevelTlds = new Set(await this.getCommonSecondLevelTlds());

        if (parts.length >= 3) {
            // Check if the last two parts form a known 2-level TLD
            const lastTwo = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
            if (commonSecondLevelTlds.has(lastTwo)) {
                return lastTwo;
            }
        }

        // Default to top-level domain (last part)
        const lastPart = parts[parts.length - 1];
        if (!lastPart) {
            throw new Error('Unable to extract last part from domain');
        }
        return lastPart;
    }

    protected normalize(domain: string): string {
        const lowerCased = domain.toLowerCase().trim();

        // Add protocol if missing for URL parsing
        const urlToParse = lowerCased.includes('://') ? lowerCased : `https://${lowerCased}`;

        let normalized: string;
        try {
            const { hostname } = new URL(urlToParse);
            normalized = hostname;
        } catch (_) {
            // Fallback for edge cases
            const withoutProtocol = lowerCased.replace(/^https?:\/\//, '');
            const withoutPath = withoutProtocol.split('/')[0] || withoutProtocol;
            normalized = withoutPath.split(':')[0] || withoutPath;
        }

        this.logger.debug(
            {
                domain,
                lowerCased,
                normalized,
            },
            'Normalizing domain'
        );
        return normalized;
    }

    protected async getCommonSecondLevelTlds(): Promise<string[]> {
        const cacheKey = 'TldExtractor::getCommonSecondLevelTlds';

        try {
            const cached = await this.cache.get(cacheKey);
            if (cached) {
                this.logger.debug('Using cached second-level TLDs');
                return cached;
            }

            const tldsEntities = await this.tldRepo.findMany({
                tld: Like('%.%'),
            });

            const tlds = tldsEntities.map((row) => row.tld);
            await this.cache.set(cacheKey, tlds, this.cacheTTL);

            this.logger.debug({ count: tlds.length }, 'Loaded second-level TLDs from database');
            return tlds;
        } catch (error) {
            this.logger.error({ error }, 'Failed to load second-level TLDs');
            // Return empty array as fallback - extraction will still work for simple TLDs
            return [];
        }
    }

    async isValidTld(tld: string): Promise<boolean> {
        const cacheKey = `TldExtractor::isValidTld::${tld}`;
        try {
            const cached = await this.cache.get(cacheKey);
            if (cached) {
                return cached;
            }

            const tldEntity = await this.tldRepo.findOne({ tld });
            if (tldEntity) {
                await this.cache.set(cacheKey, !!tldEntity);
            }
            return !!tldEntity;
        } catch (error) {
            this.logger.error({ error, tld }, 'Failed to validate TLD');
            return false;
        }
    }

    async extractDomainInfo(domain: string): Promise<DomainExtractionInfo> {
        try {
            this.logger.debug({ domain }, 'Extracting domain info');

            let tld: string;
            let domainName: string;
            let isValid = true;

            // Extract TLD using existing method
            try {
                tld = await this.extract(domain);
            } catch (error) {
                this.logger.debug({ domain, error }, 'Failed to extract TLD');
                // Return fallback values for logging purposes
                return {
                    domainName: domain,
                    tld: 'unknown',
                    isValid: false,
                };
            }

            // Validate TLD
            const isValidTLD = await this.isValidTld(tld);
            if (!isValidTLD) {
                this.logger.debug({ domain, tld }, 'Invalid TLD detected');
                isValid = false;
            }

            // Extract domain name (everything before the TLD)
            const normalized = this.normalize(domain);
            const parts = normalized.split('.');

            // Remove TLD parts from the end
            const tldParts = tld.split('.');
            const domainParts = parts.slice(0, -tldParts.length);

            if (domainParts.length === 0) {
                this.logger.debug({ domain, tld }, 'No domain name found');
                domainName = domain; // Use original domain for logging
                isValid = false;
            } else {
                domainName = domainParts.join('.');

                // Validate domain name is not empty and contains valid characters
                if (!domainName || domainName.trim().length === 0) {
                    this.logger.debug({ domain, tld, domainName }, 'Empty domain name detected');
                    domainName = domain; // Use original domain for logging
                    isValid = false;
                }
            }

            this.logger.debug({ domain, tld, domainName, isValid }, 'Domain info extraction completed');
            return { domainName, tld, isValid };
        } catch (error) {
            this.logger.error({ error, domain }, 'Failed to extract domain info');
            return {
                domainName: domain,
                tld: 'unknown',
                isValid: false,
            };
        }
    }
}
