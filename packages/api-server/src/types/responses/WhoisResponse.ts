import type { WhoisData, WhoisResponse } from '@who-tf-info/shared';

export const createSuccessWhoisResponse = (
    domain: string,
    tld: string,
    available: boolean,
    whoisData: WhoisData
): WhoisResponse => ({ success: true, domain, tld, available, whoisData });

export const createAvailableWhoisResponse = (domain: string, tld: string): WhoisResponse => ({
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
): WhoisResponse => ({ success: false, domain, tld, available, message });
