import { CacheTTL } from '@app/constants/CacheTTL';
import { TopLevelDomainRepoService } from '@app/database/db-service/TopLevelDomainRepoService';
import { AppLogger } from '@app/utils/createContainer';
import Keyv from '@keyvhq/core';
import type { Logger } from 'pino';
import { inject, singleton } from 'tsyringe';
import { Like } from 'typeorm';

@singleton()
export class TldExtractor {
    protected tldRepo: TopLevelDomainRepoService;
    protected cache: Keyv;
    protected logger: Logger;
    protected cacheTTL = CacheTTL.SECOND_LEVEL_TLDS;

    constructor(
        @inject(TopLevelDomainRepoService) tldRepo: TopLevelDomainRepoService,
        @inject(AppLogger) logger: Logger,
        @inject(Keyv) cache: Keyv
    ) {
        this.logger = logger;
        this.tldRepo = tldRepo;
        this.cache = cache;
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
}
