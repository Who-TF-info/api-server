import { BaseRemoteDataFetcher, type BaseRemoteDataFetcherOptions } from '@app/services/data/BaseRemoteDataFetcher';

// WHOIS server configuration object
export interface WhoisServerConfig {
    host: string;
    query?: string;
    punycode?: boolean;
}

// Community WHOIS mappings can be:
// - string (simple hostname)
// - object with host/query config
// - null (no WHOIS server available)
export type WhoisMappingValue = string | WhoisServerConfig | null;

// Special IP lookup configuration
export interface SpecialIpConfig {
    ip: WhoisServerConfig;
}

// The root structure includes special entries
export interface CommunityWhoisMappings {
    // Regular TLD mappings
    [tld: string]: WhoisMappingValue | SpecialIpConfig;

    // Special entries
    '': string; // Default fallback
    _: SpecialIpConfig; // IP lookup configuration
}

// Processed mapping for database storage
export type ProcessedWhoisMapping = {
    tld: string;
    whoisServer: string;
    queryTemplate?: string;
    supportsPunycode?: boolean;
};

export class WhoisMappingsImporter extends BaseRemoteDataFetcher<CommunityWhoisMappings, ProcessedWhoisMapping[]> {
    remoteUrl = 'https://raw.githubusercontent.com/FurqanSoftware/node-whois/master/servers.json';

    constructor({ logger, cache }: Omit<BaseRemoteDataFetcherOptions, 'name'>) {
        super({ logger, cache, name: 'WhoisMappingsImporter' });
        // Set cache TTL to 24 hours (community data changes more frequently than IANA)
        this.cacheTtl = 86_400_000;
    }

    protected override transformData(mappings: CommunityWhoisMappings): ProcessedWhoisMapping[] {
        const processed: ProcessedWhoisMapping[] = [];

        this.logger.debug({ totalEntries: Object.keys(mappings).length }, 'Processing community WHOIS mappings');

        for (const [tld, config] of Object.entries(mappings)) {
            // Skip special entries
            if (tld === '' || tld === '_') {
                this.logger.debug({ tld }, 'Skipping special entry');
                continue;
            }

            // Skip null entries (no WHOIS server available)
            if (config === null) {
                this.logger.debug({ tld }, 'Skipping TLD with no WHOIS server');
                continue;
            }

            // Skip internationalized domains (xn-- prefix) as requested
            if (tld.startsWith('xn--')) {
                this.logger.debug({ tld }, 'Skipping internationalized domain');
                continue;
            }

            let whoisServer: string;
            let queryTemplate: string | undefined;
            let supportsPunycode: boolean | undefined;

            if (typeof config === 'string') {
                // Simple string mapping
                whoisServer = config;
            } else if (typeof config === 'object' && config && 'host' in config) {
                // Object with host/query configuration
                const whoisConfig = config as WhoisServerConfig;
                whoisServer = whoisConfig.host;
                queryTemplate = whoisConfig.query;
                supportsPunycode = whoisConfig.punycode;
            } else {
                this.logger.warn({ tld, config }, 'Invalid WHOIS configuration, skipping');
                continue;
            }

            processed.push({
                tld: tld.toLowerCase(), // Normalize to lowercase
                whoisServer,
                queryTemplate,
                supportsPunycode,
            });
        }

        this.logger.info({ processedCount: processed.length }, 'Successfully processed community WHOIS mappings');

        return processed;
    }
}
