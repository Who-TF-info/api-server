import type { WhoisData } from '@app/types/WhoisData';
import type { BaseApiResponse } from './BaseResponse';

export interface WhoIsResponse extends BaseApiResponse {
    domain: string;
    tld?: string;
    available?: boolean;
    whoisData?: WhoisData;
}

export const createSuccessWhoisResponse = (
    domain: string,
    tld: string,
    available: boolean,
    whoisData: WhoisData
): WhoIsResponse => ({ success: true, domain, tld, available, whoisData });

export const createAvailableWhoisResponse = (domain: string, tld: string): WhoIsResponse => ({
    success: true,
    domain,
    tld,
    available: true,
});

export const createFailedWhoisResponse = (
    domain: string,
    message: string,
    tld?: string,
    available?: boolean
): WhoIsResponse => ({ success: false, domain, tld, available, message });
