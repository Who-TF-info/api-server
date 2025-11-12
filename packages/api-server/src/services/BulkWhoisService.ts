import { BaseLoggableService } from '@app/services/core/BaseLoggableService';
import { TldResolver } from '@app/services/lookup/TldResolver';
import { TldExtractor } from '@app/services/TldExtractor';
import type { BulkOptions } from '@app/types/responses/BulkWhoisResponse';
import { AppLogger } from '@app/utils/createContainer';
import type { BulkWhoisResult } from '@who-tf-info/shared';
import type { Logger } from 'pino';
import { inject, singleton } from 'tsyringe';

@singleton()
export class BulkWhoisService extends BaseLoggableService {
    protected tldResolver: TldResolver;
    protected tldExtractor: TldExtractor;

    protected defaultMaxConcurrent = 5;
    protected maxDomainsPerRequest = 100;

    constructor(
        @inject(AppLogger) logger: Logger,
        @inject(TldResolver) tldResolver: TldResolver,
        @inject(TldExtractor) tldExtractor: TldExtractor
    ) {
        super(logger.child({ module: 'BulkWhoisService' }));
        this.tldResolver = tldResolver;
        this.tldExtractor = tldExtractor;
    }

    async processBulk(domains: string[], options: BulkOptions = {}): Promise<BulkWhoisResult[]> {
        // Validate input
        if (!Array.isArray(domains) || domains.length === 0) {
            throw new Error('Domains array must not be empty');
        }

        if (domains.length > this.maxDomainsPerRequest) {
            throw new Error(`Maximum ${this.maxDomainsPerRequest} domains allowed per request`);
        }

        const skipAvailabilityCheck = options.skip_availability_check || false;
        const maxConcurrent = Math.min(
            options.max_concurrent || this.defaultMaxConcurrent,
            10 // Hard limit to prevent resource exhaustion
        );

        this.logger.info(
            {
                domainCount: domains.length,
                maxConcurrent,
                skipAvailabilityCheck,
            },
            'Starting bulk WHOIS processing'
        );

        const results: BulkWhoisResult[] = [];

        // Process domains in batches to control concurrency
        for (let i = 0; i < domains.length; i += maxConcurrent) {
            const batch = domains.slice(i, i + maxConcurrent);

            this.logger.debug(
                {
                    batchIndex: Math.floor(i / maxConcurrent) + 1,
                    batchSize: batch.length,
                    domainsInBatch: batch,
                },
                'Processing batch'
            );

            const batchPromises = batch.map((domain, index) =>
                this.processSingleDomain(domain, skipAvailabilityCheck, i + index)
            );

            const batchResults = await Promise.allSettled(batchPromises);
            const processedResults = this.processBatchResults(batch, batchResults);
            results.push(...processedResults);
        }

        this.logger.info(
            {
                total: results.length,
                successful: results.filter((r) => r.success).length,
                failed: results.filter((r) => !r.success).length,
            },
            'Bulk WHOIS processing completed'
        );

        return results;
    }

    protected async processSingleDomain(
        domain: string,
        skipAvailabilityCheck: boolean,
        index: number
    ): Promise<BulkWhoisResult> {
        const startTime = Date.now();

        try {
            // Extract domain info first for validation
            const extraction = await this.tldExtractor.extractDomainInfo(domain);

            if (!extraction.isValid) {
                return {
                    domain,
                    success: false,
                    tld: extraction.tld,
                    error: 'Invalid domain format',
                    processing_time_ms: Date.now() - startTime,
                };
            }

            // Process WHOIS lookup
            const whoisResult = await this.tldResolver.getWhoisData(domain, skipAvailabilityCheck);

            const processingTime = Date.now() - startTime;

            if (whoisResult === null) {
                // Domain is available
                return {
                    domain,
                    success: true,
                    tld: extraction.tld,
                    available: true,
                    cache_hit: false, // Available domains are not cached
                    processing_time_ms: processingTime,
                };
            }

            // Extract cache hit info and clean data for response
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { isCached, rawWhois: _rawWhois, rawRdap: _rawRdap, ...cleanWhoisData } = whoisResult;

            return {
                domain,
                success: true,
                tld: extraction.tld,
                available: false,
                cache_hit: isCached,
                whoisData: cleanWhoisData,
                processing_time_ms: processingTime,
            };
        } catch (error) {
            const processingTime = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            this.logger.warn(
                {
                    domain,
                    index,
                    error: errorMessage,
                    processingTime,
                },
                'Domain processing failed'
            );

            return {
                domain,
                success: false,
                error: errorMessage,
                processing_time_ms: processingTime,
            };
        }
    }

    protected processBatchResults(
        domains: string[],
        results: PromiseSettledResult<BulkWhoisResult>[]
    ): BulkWhoisResult[] {
        return results.map((result, index) => {
            if (result.status === 'fulfilled') {
                return result.value;
            }

            // Handle rejected promises
            const domain = domains[index] || 'unknown';
            const errorMessage =
                result.reason instanceof Error ? result.reason.message : 'Promise rejected with unknown error';

            this.logger.error(
                {
                    domain,
                    error: errorMessage,
                },
                'Batch processing promise rejected'
            );

            return {
                domain,
                success: false,
                error: errorMessage,
                processing_time_ms: 0,
            };
        });
    }
}
