import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { BulkWhoisService } from '@app/services/BulkWhoisService';
import type { TldResolver } from '@app/services/lookup/TldResolver';
import type { TldExtractor } from '@app/services/TldExtractor';
import type { BulkOptions } from '@app/types/responses/BulkWhoisResponse';
import type { Logger } from 'pino';

interface MockLogger extends Partial<Logger> {
    child: ReturnType<typeof mock>;
    info: ReturnType<typeof mock>;
    debug: ReturnType<typeof mock>;
    warn: ReturnType<typeof mock>;
    error: ReturnType<typeof mock>;
}

interface MockTldResolver extends Partial<TldResolver> {
    getWhoisData: ReturnType<typeof mock>;
}

interface MockTldExtractor extends Partial<TldExtractor> {
    extractDomainInfo: ReturnType<typeof mock>;
}

describe('BulkWhoisService', () => {
    let service: BulkWhoisService;
    let mockLogger: MockLogger;
    let mockTldResolver: MockTldResolver;
    let mockTldExtractor: MockTldExtractor;

    beforeEach(() => {
        mockLogger = {
            child: mock(() => mockLogger as Logger),
            info: mock(),
            debug: mock(),
            warn: mock(),
            error: mock(),
        };

        mockTldResolver = {
            getWhoisData: mock(),
        };

        mockTldExtractor = {
            extractDomainInfo: mock(),
        };

        service = new BulkWhoisService(
            mockLogger as unknown as Logger,
            mockTldResolver as unknown as TldResolver,
            mockTldExtractor as unknown as TldExtractor
        );
    });

    describe('processBulk', () => {
        it('should reject empty domains array', async () => {
            await expect(service.processBulk([])).rejects.toThrow('Domains array must not be empty');
        });

        it('should reject too many domains', async () => {
            const domains = Array(101).fill('example.com');
            await expect(service.processBulk(domains)).rejects.toThrow('Maximum 100 domains allowed per request');
        });

        it('should process single valid domain successfully', async () => {
            const domains = ['example.com'];

            mockTldExtractor.extractDomainInfo = mock().mockResolvedValue({
                domainName: 'example',
                tld: 'com',
                isValid: true,
            });

            mockTldResolver.getWhoisData = mock().mockResolvedValue({
                domain: 'example.com',
                registrar: 'Test Registrar',
                isCached: false,
                source: 'rdap',
                rawWhois: 'raw data',
                rawRdap: { domain: 'example.com' },
            });

            const results = await service.processBulk(domains);

            expect(results).toHaveLength(1);
            expect(results[0]).toMatchObject({
                domain: 'example.com',
                success: true,
                tld: 'com',
                available: false,
                cache_hit: false,
                whoisData: {
                    domain: 'example.com',
                    registrar: 'Test Registrar',
                    source: 'rdap',
                },
            });

            // Verify raw data is excluded
            expect(results[0]?.whoisData).not.toHaveProperty('rawWhois');
            expect(results[0]?.whoisData).not.toHaveProperty('rawRdap');
            expect(results[0]?.whoisData).not.toHaveProperty('isCached');
        });

        it('should handle available domains', async () => {
            const domains = ['available.com'];

            mockTldExtractor.extractDomainInfo = mock().mockResolvedValue({
                domainName: 'available',
                tld: 'com',
                isValid: true,
            });

            mockTldResolver.getWhoisData = mock().mockResolvedValue(null);

            const results = await service.processBulk(domains);

            expect(results).toHaveLength(1);
            expect(results[0]).toMatchObject({
                domain: 'available.com',
                success: true,
                tld: 'com',
                available: true,
                cache_hit: false,
            });
            expect(results[0]?.whoisData).toBeUndefined();
        });

        it('should handle invalid domain format', async () => {
            const domains = ['invalid..domain'];

            mockTldExtractor.extractDomainInfo = mock().mockResolvedValue({
                domainName: 'invalid.',
                tld: 'domain',
                isValid: false,
            });

            const results = await service.processBulk(domains);

            expect(results).toHaveLength(1);
            expect(results[0]).toMatchObject({
                domain: 'invalid..domain',
                success: false,
                tld: 'domain',
                error: 'Invalid domain format',
            });
        });

        it('should handle resolver errors gracefully', async () => {
            const domains = ['error.com'];

            mockTldExtractor.extractDomainInfo = mock().mockResolvedValue({
                domainName: 'error',
                tld: 'com',
                isValid: true,
            });

            mockTldResolver.getWhoisData = mock().mockRejectedValue(new Error('RDAP server error'));

            const results = await service.processBulk(domains);

            expect(results).toHaveLength(1);
            expect(results[0]).toMatchObject({
                domain: 'error.com',
                success: false,
                error: 'RDAP server error',
            });
        });

        it('should process multiple domains with concurrency control', async () => {
            const domains = ['example1.com', 'example2.com', 'example3.com'];
            const options: BulkOptions = { max_concurrent: 2 };

            mockTldExtractor.extractDomainInfo = mock()
                .mockResolvedValueOnce({
                    domainName: 'example1',
                    tld: 'com',
                    isValid: true,
                })
                .mockResolvedValueOnce({
                    domainName: 'example2',
                    tld: 'com',
                    isValid: true,
                })
                .mockResolvedValueOnce({
                    domainName: 'example3',
                    tld: 'com',
                    isValid: true,
                });

            mockTldResolver.getWhoisData = mock()
                .mockResolvedValueOnce({
                    domain: 'example1.com',
                    registrar: 'Test1',
                    isCached: true,
                })
                .mockResolvedValueOnce(null) // available
                .mockResolvedValueOnce({
                    domain: 'example3.com',
                    registrar: 'Test3',
                    isCached: false,
                });

            const results = await service.processBulk(domains, options);

            expect(results).toHaveLength(3);
            expect(results[0]).toMatchObject({
                domain: 'example1.com',
                success: true,
                available: false,
                cache_hit: true,
            });
            expect(results[1]).toMatchObject({
                domain: 'example2.com',
                success: true,
                available: true,
                cache_hit: false,
            });
            expect(results[2]).toMatchObject({
                domain: 'example3.com',
                success: true,
                available: false,
                cache_hit: false,
            });
        });

        it('should respect max_concurrent limits', async () => {
            const domains = Array(20)
                .fill(0)
                .map((_, i) => `example${i}.com`);
            const options: BulkOptions = { max_concurrent: 15 }; // Should be clamped to 10

            // Mock all calls to return quickly
            mockTldExtractor.extractDomainInfo = mock().mockResolvedValue({
                domainName: 'example',
                tld: 'com',
                isValid: true,
            });

            mockTldResolver.getWhoisData = mock().mockResolvedValue(null);

            const results = await service.processBulk(domains, options);

            expect(results).toHaveLength(20);
            // Verify all domains were processed
            results.forEach((result, index) => {
                expect(result.domain).toBe(`example${index}.com`);
                expect(result.success).toBe(true);
            });
        });

        it('should handle skip_availability_check option', async () => {
            const domains = ['example.com'];
            const options: BulkOptions = { skip_availability_check: true };

            mockTldExtractor.extractDomainInfo = mock().mockResolvedValue({
                domainName: 'example',
                tld: 'com',
                isValid: true,
            });

            mockTldResolver.getWhoisData = mock().mockResolvedValue({
                domain: 'example.com',
                registrar: 'Test',
                isCached: false,
            });

            await service.processBulk(domains, options);

            expect(mockTldResolver.getWhoisData).toHaveBeenCalledWith('example.com', true);
        });
    });
});
