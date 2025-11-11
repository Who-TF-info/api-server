import type { WhoisData } from '@app/types/WhoisData';
import type { BaseApiResponse } from './BaseResponse';

export interface BulkOptions {
    skip_availability_check?: boolean;
    max_concurrent?: number;
}

export interface BulkWhoisRequest {
    domains: string[];
    options?: BulkOptions;
}

export interface BulkWhoisResult {
    domain: string;
    success: boolean;
    tld?: string;
    available?: boolean;
    cache_hit?: boolean;
    whoisData?: Omit<WhoisData, 'rawWhois' | 'rawRdap'>;
    error?: string;
    processing_time_ms?: number;
}

export interface BulkWhoisSummary {
    total: number;
    successful: number;
    failed: number;
    cache_hits: number;
    available_domains: number;
    processing_time_ms: number;
}

export interface BulkWhoisResponse extends BaseApiResponse {
    results: BulkWhoisResult[];
    summary: BulkWhoisSummary;
}

export const createBulkWhoisResponse = (results: BulkWhoisResult[], totalProcessingTime: number): BulkWhoisResponse => {
    const successful = results.filter((r) => r.success).length;
    const failed = results.length - successful;
    const cacheHits = results.filter((r) => r.cache_hit === true).length;
    const availableDomains = results.filter((r) => r.available === true).length;

    const summary: BulkWhoisSummary = {
        total: results.length,
        successful,
        failed,
        cache_hits: cacheHits,
        available_domains: availableDomains,
        processing_time_ms: totalProcessingTime,
    };

    return {
        success: true,
        results,
        summary,
    };
};

export const createBulkWhoisErrorResponse = (message: string): BulkWhoisResponse => ({
    success: false,
    message,
    results: [],
    summary: {
        total: 0,
        successful: 0,
        failed: 0,
        cache_hits: 0,
        available_domains: 0,
        processing_time_ms: 0,
    },
});
