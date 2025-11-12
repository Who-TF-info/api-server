import type { WhoisData } from '../types/WhoisData';
import type { BaseApiResponse } from './base';

export interface WhoisResponse extends BaseApiResponse {
    domain: string;
    tld?: string;
    available?: boolean;
    whoisData?: WhoisData;
}
