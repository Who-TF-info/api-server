import type { WhoisData } from '../types/WhoisData';
import type { BaseApiResponse } from './base';

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
