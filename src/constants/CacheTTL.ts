// Centralized cache TTL constants
// All values in milliseconds for consistency

export const CacheTTL = {
    // Domain lookup results - shorter TTL for dynamic data
    DOMAIN_LOOKUP: 10 * 60 * 1000, // 10 minutes

    // RDAP responses - medium TTL, data changes occasionally
    RDAP_RESPONSE: 5 * 60 * 1000, // 5 minutes

    // WHOIS responses - medium TTL, data changes occasionally
    WHOIS_RESPONSE: 5 * 60 * 1000, // 5 minutes

    // TLD entities - longer TTL, infrastructure data changes rarely
    TLD_ENTITY: 60 * 60 * 1000, // 1 hour

    // TLD extraction data - very long TTL, static data
    TLD_EXTRACTION: 24 * 60 * 60 * 1000, // 24 hours

    // Second-level TLD lists - very long TTL, rarely updated
    SECOND_LEVEL_TLDS: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;

// Helper functions for readability
export const minutes = (count: number) => count * 60 * 1000;
export const hours = (count: number) => count * 60 * 60 * 1000;
export const days = (count: number) => count * 24 * 60 * 60 * 1000;
