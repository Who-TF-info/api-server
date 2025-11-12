import { BaseRemoteDataFetcher, type BaseRemoteDataFetcherOptions } from '@app/services/data/BaseRemoteDataFetcher';

export interface IanaRdapBootstrap {
    description: string;
    publication: string; // ISO date string
    services: IanaRdapService[];
    version: string;
}

export type IanaRdapService = [
    string[], // Array of TLD strings (e.g., ["com", "net"] or ["kg"])
    string[], // Array of RDAP server URLs (usually just one URL)
];

// Alternative, more descriptive interface (same data, better names):
export interface IanaRdapServiceDescriptive {
    tlds: string[];
    rdapServers: string[];
}

// Helper type for processing
export type ProcessedRdapMapping = {
    tld: string;
    rdapServer: string;
};

export class IanaRdapImporter extends BaseRemoteDataFetcher<IanaRdapBootstrap, ProcessedRdapMapping[]> {
    remoteUrl = 'https://data.iana.org/rdap/dns.json';

    constructor({ logger, cache }: Omit<BaseRemoteDataFetcherOptions, 'name'>) {
        super({ logger, cache, name: 'IanaRdapImporter' });
        // Set cache TTL to 7 days for IANA data (changes infrequently)
        this.cacheTtl = 604_800_000;
    }

    protected override transformData(bootstrap: IanaRdapBootstrap): ProcessedRdapMapping[] {
        const mappings: ProcessedRdapMapping[] = [];

        this.logger.debug(
            {
                servicesCount: bootstrap.services.length,
                version: bootstrap.version,
                publication: bootstrap.publication,
            },
            'Processing IANA RDAP bootstrap data'
        );

        for (const service of bootstrap.services) {
            const [tlds, servers] = service;
            const primaryServer = servers[0]; // Usually only one server per service

            if (!primaryServer) {
                this.logger.warn({ tlds, servers }, 'RDAP service has no servers, skipping');
                continue;
            }

            for (const tld of tlds) {
                // Skip internationalized domains (xn-- prefix)
                if (tld.startsWith('xn--')) {
                    this.logger.debug({ tld }, 'Skipping internationalized domain');
                    continue;
                }

                mappings.push({
                    tld: tld.toLowerCase(), // Normalize to lowercase
                    rdapServer: primaryServer,
                });
            }
        }

        this.logger.info({ mappingsCount: mappings.length }, 'Successfully processed IANA RDAP bootstrap data');

        return mappings;
    }
}
