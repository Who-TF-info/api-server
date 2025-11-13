import { beforeEach, describe, expect, it } from 'bun:test';
import axios from 'axios';
import { WhoTfApiClient } from '../src';

describe('Domain Validation', () => {
    let client: WhoTfApiClient;

    // Create client for validation testing
    beforeEach(() => {
        client = new WhoTfApiClient({
            baseUrl: 'https://test.com',
            apiKey: 'test-key',
            httpClient: axios.create(),
        });
    });

    describe('Valid domain formats', () => {
        const validDomains = [
            'example.com',
            'test.net',
            'sub.domain.org',
            'my-website.co.uk',
            'site123.info',
            'a.b',
            'very-long-domain-name-that-is-still-valid.museum',
            'xn--nxasmq6b.xn--j6w193g', // IDN domain
            '123domain.com',
            'domain123.net',
        ];

        it.each(validDomains)('should accept valid domain: %s', async (domain) => {
            // We test validation by checking if it throws for domain format
            // Since we don't want to make actual requests, we'll test the validation indirectly
            expect(() => {
                // This will internally call isValidDomain before making the request
                client.getWhoisData(domain);
            }).not.toThrow();
        });
    });

    describe('Invalid domain formats', () => {
        const invalidDomains = [
            '',
            'invalid-domain',
            'no-tld',
            '.com',
            'domain.',
            'space domain.com',
            'domain..com',
            '-domain.com',
            'domain-.com',
            'a'.repeat(254), // Too long
            `very-long-subdomain-${'a'.repeat(50)}.com`,
        ];

        it.each(invalidDomains)('should reject invalid domain: %s', async (domain) => {
            expect(() => client.getWhoisData(domain)).toThrow(`Invalid domain name format: ${domain}`);

            expect(() => client.checkDomainAvailability(domain)).toThrow(`Invalid domain name format: ${domain}`);
        });
    });

    describe('Bulk validation', () => {
        it('should validate all domains in bulk request', async () => {
            const mixedDomains = ['example.com', 'invalid-domain', 'test.net'];

            expect(() => client.bulkWhoisLookup(mixedDomains)).toThrow('Invalid domain name format: invalid-domain');
        });

        it('should accept all valid domains in bulk request', () => {
            const validDomains = ['example.com', 'test.net', 'site.org'];

            // Should not throw validation error (will fail on network/mock, but not validation)
            expect(() => {
                client.bulkWhoisLookup(validDomains);
            }).not.toThrow();
        });
    });

    describe('Edge cases', () => {
        it('should handle domain with maximum valid length', () => {
            // Maximum domain length is 253 characters
            const longDomain = `${'a'.repeat(60)}.${'b'.repeat(60)}.${'c'.repeat(60)}.${'d'.repeat(60)}.com`;

            if (longDomain.length <= 253) {
                expect(() => {
                    client.getWhoisData(longDomain);
                }).not.toThrow();
            }
        });

        it('should reject domain exceeding maximum length', async () => {
            const tooLongDomain = `${'a'.repeat(254)}.com`;

            expect(() => client.getWhoisData(tooLongDomain)).toThrow(`Invalid domain name format: ${tooLongDomain}`);
        });

        it('should handle special characters properly', async () => {
            const domainsWithSpecialChars = ['domain@example.com', 'domain#test.com', 'domain$.com', 'domain%.com'];

            for (const domain of domainsWithSpecialChars) {
                expect(() => client.getWhoisData(domain)).toThrow(`Invalid domain name format: ${domain}`);
            }
        });
    });
});
