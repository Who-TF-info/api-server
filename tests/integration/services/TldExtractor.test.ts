import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { appContainer } from '@app/config';
import { TopLevelDomainRepoService } from '@app/database/db-service/TopLevelDomainRepoService';
import { TldExtractor } from '@app/services/TldExtractor';
import Keyv from '@keyvhq/core';
import { integrationTestHelper } from '../../helpers/integration-helper';

describe('TldExtractor', () => {
    const service = appContainer.resolve(TldExtractor);
    const tldRepo = appContainer.resolve(TopLevelDomainRepoService);
    const cache = appContainer.resolve(Keyv);

    beforeAll(async () => {
        await integrationTestHelper.setup();

        // Insert test TLD data (using unique test names to avoid conflicts)
        const testTlds = [
            'test.example',
            'test2.example',
            'org.test',
            'gov.test',
            'com.test',
            'net.test',
            'co.test',
            'org.test2',
            'example',
            'test',
            'sample',
            'demo',
            'mock',
            'fake',
            'com', // Add common TLD for edge case testing
        ];

        for (const tld of testTlds) {
            try {
                await tldRepo.save({ tld, type: 'generic', isActive: true });
            } catch (error) {
                // Skip if already exists (for idempotent tests)
                if (!(error as Error).message?.includes('Duplicate entry')) {
                    throw error;
                }
            }
        }
    });

    afterAll(async () => {
        await integrationTestHelper.cleanup();
    });

    describe('extract()', () => {
        it('should fail with invalid domains', async () => {
            const invalidDomains = [
                'example', // No TLD
                '', // Empty string
                '   ', // Whitespace only
                'ex@mple.com', // Invalid characters
                'example!.com', // Invalid characters
                'example$.com', // Invalid characters
            ];

            for (const domain of invalidDomains) {
                expect(service.extract(domain)).rejects.toThrow();
            }
        });

        it('should extract TLD from various valid domain formats', async () => {
            const testCases = [
                { domain: 'example.example', expected: 'example' },
                { domain: 'EXAMPLE.EXAMPLE', expected: 'example' }, // Case-insensitive
                { domain: 'sub.example.test', expected: 'test' },
                { domain: 'example.sample', expected: 'sample' }, // Simple domain
                { domain: 'example.demo', expected: 'demo' }, // Simple domain
                { domain: 'example.mock', expected: 'mock' }, // Simple domain
                { domain: 'example.fake', expected: 'fake' }, // Simple domain
            ];

            for (const { domain, expected } of testCases) {
                const result = await service.extract(domain);
                expect(result).toBe(expected);
            }
        });

        it('should extract second-level TLDs correctly', async () => {
            const testCases = [
                { domain: 'example.test.example', expected: 'test.example' },
                { domain: 'test.org.test', expected: 'org.test' },
                { domain: 'gov.gov.test', expected: 'gov.test' },
                { domain: 'site.com.test', expected: 'com.test' },
                { domain: 'company.co.test', expected: 'co.test' },
                { domain: 'example.test2.example', expected: 'test2.example' },
            ];

            for (const { domain, expected } of testCases) {
                const result = await service.extract(domain);
                expect(result).toBe(expected);
            }
        });

        it('should handle edge cases gracefully', async () => {
            const edgeCases = [
                { domain: 'localhost', shouldThrow: true }, // No TLD - should throw 'Invalid domain format'
                { domain: '192.168.1.1', expected: '1' }, // IP address - gets last part as "TLD"
                { domain: 'example..com', expected: 'com' }, // Double dots get normalized
                { domain: '.example.com', expected: 'com' }, // Leading dot gets normalized
            ];

            for (const testCase of edgeCases) {
                if (testCase.shouldThrow) {
                    // This should throw because it doesn't have a TLD structure
                    expect(service.extract(testCase.domain)).rejects.toThrow();
                } else if (testCase.expected) {
                    const result = await service.extract(testCase.domain);
                    expect(result).toBe(testCase.expected);
                }
            }
        });
    });

    describe('isValidTld()', () => {
        it('should validate TLDs correctly', async () => {
            // Test valid TLDs (should exist from test setup)
            expect(await service.isValidTld('example')).toBe(true);
            expect(await service.isValidTld('test.example')).toBe(true);
            expect(await service.isValidTld('org.test')).toBe(true);

            // Test invalid TLDs
            expect(await service.isValidTld('nonexistent')).toBe(false);
            expect(await service.isValidTld('fake.tld')).toBe(false);
            expect(await service.isValidTld('invalid')).toBe(false);
        });
    });

    describe('caching', () => {
        it('should cache second-level TLDs', async () => {
            // Clear any existing cache
            const cacheKey = 'TldExtractor::getCommonSecondLevelTlds';
            await cache.delete(cacheKey);

            // First call should hit database and cache result
            const result1 = await service.extract('example.test.example');
            expect(result1).toBe('test.example');

            // Verify cache was populated
            const cachedData = await cache.get(cacheKey);
            expect(cachedData).toBeDefined();
            expect(Array.isArray(cachedData)).toBe(true);
            expect(cachedData).toContain('test.example');

            // Second call should use cache
            const result2 = await service.extract('test.test.example');
            expect(result2).toBe('test.example');
        });
    });
});
