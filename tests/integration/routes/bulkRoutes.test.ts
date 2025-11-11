import { afterAll, beforeAll, beforeEach, describe, expect, it, spyOn } from 'bun:test';
import { appContainer } from '@app/config';
import { honoApp } from '@app/http-server';
import { AuthService } from '@app/services/AuthService';
import { BulkWhoisService } from '@app/services/BulkWhoisService';
import type { BulkWhoisRequest, BulkWhoisResponse } from '@app/types/responses/BulkWhoisResponse';
import { integrationTestHelper } from '../../helpers/integration-helper';

describe('Bulk Routes Integration', () => {
    let bulkService: BulkWhoisService;

    beforeAll(async () => {
        await integrationTestHelper.setup();
        bulkService = appContainer.resolve(BulkWhoisService);
    });

    beforeEach(async () => {
        await integrationTestHelper.resetTestData();
    });

    afterAll(async () => {
        await integrationTestHelper.cleanup();
    });

    describe('POST /api/v1/bulk/whois', () => {
        it('should reject requests without authentication', async () => {
            const request: BulkWhoisRequest = {
                domains: ['example.com'],
            };

            const response = await honoApp.request('/api/v1/bulk/whois', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            expect(response.status).toBe(401);
        });

        it('should reject invalid request format', async () => {
            const invalidRequest = {
                notDomains: ['example.com'],
            };

            const response = await honoApp.request('/api/v1/bulk/whois', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    apiKey: AuthService.testApiKey,
                },
                body: JSON.stringify(invalidRequest),
            });

            expect(response.status).toBe(400);
            const body = (await response.json()) as BulkWhoisResponse;
            expect(body.success).toBe(false);
            expect(body.message).toContain('Validation error');
        });

        it('should reject empty domains array', async () => {
            const request: BulkWhoisRequest = {
                domains: [],
            };

            const response = await honoApp.request('/api/v1/bulk/whois', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    apiKey: AuthService.testApiKey,
                },
                body: JSON.stringify(request),
            });

            expect(response.status).toBe(400);
            const body = (await response.json()) as BulkWhoisResponse;
            expect(body.success).toBe(false);
            expect(body.message).toContain('At least one domain is required');
        });

        it('should reject too many domains', async () => {
            const request: BulkWhoisRequest = {
                domains: Array(101).fill('example.com'),
            };

            const response = await honoApp.request('/api/v1/bulk/whois', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    apiKey: AuthService.testApiKey,
                },
                body: JSON.stringify(request),
            });

            expect(response.status).toBe(400);
            const body = (await response.json()) as BulkWhoisResponse;
            expect(body.success).toBe(false);
            expect(body.message).toContain('Maximum 100 domains allowed');
        });

        it('should process valid bulk request successfully', async () => {
            // Mock the bulk service to return controlled results
            const mockResults = [
                {
                    domain: 'example.com',
                    success: true,
                    tld: 'com',
                    available: false,
                    cache_hit: true,
                    whoisData: {
                        domain: 'example.com',
                        registrar: 'Test Registrar',
                        source: 'rdap' as const,
                    },
                    processing_time_ms: 100,
                },
                {
                    domain: 'available.xyz',
                    success: true,
                    tld: 'xyz',
                    available: true,
                    cache_hit: false,
                    processing_time_ms: 50,
                },
            ];

            spyOn(bulkService, 'processBulk').mockResolvedValue(mockResults);

            const request: BulkWhoisRequest = {
                domains: ['example.com', 'available.xyz'],
                options: {
                    skip_availability_check: false,
                    max_concurrent: 2,
                },
            };

            const response = await honoApp.request('/api/v1/bulk/whois', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    apiKey: AuthService.testApiKey,
                },
                body: JSON.stringify(request),
            });

            expect(response.status).toBe(200);
            const body = (await response.json()) as BulkWhoisResponse;

            expect(body.success).toBe(true);
            expect(body.results).toHaveLength(2);
            expect(body.summary).toMatchObject({
                total: 2,
                successful: 2,
                failed: 0,
                cache_hits: 1,
                available_domains: 1,
            });

            // Verify service was called with correct parameters
            expect(bulkService.processBulk).toHaveBeenCalledWith(['example.com', 'available.xyz'], {
                skip_availability_check: false,
                max_concurrent: 2,
            });
        });

        it('should handle mixed success and failure results', async () => {
            const mockResults = [
                {
                    domain: 'example.com',
                    success: true,
                    tld: 'com',
                    available: false,
                    cache_hit: false,
                    whoisData: {
                        domain: 'example.com',
                        registrar: 'Test',
                        source: 'rdap' as const,
                    },
                    processing_time_ms: 200,
                },
                {
                    domain: 'invalid..domain',
                    success: false,
                    error: 'Invalid domain format',
                    processing_time_ms: 5,
                },
            ];

            spyOn(bulkService, 'processBulk').mockResolvedValue(mockResults);

            const request: BulkWhoisRequest = {
                domains: ['example.com', 'invalid..domain'],
            };

            const response = await honoApp.request('/api/v1/bulk/whois', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    apiKey: AuthService.testApiKey,
                },
                body: JSON.stringify(request),
            });

            expect(response.status).toBe(200);
            const body = (await response.json()) as BulkWhoisResponse;

            expect(body.success).toBe(true);
            expect(body.results).toHaveLength(2);
            expect(body.summary).toMatchObject({
                total: 2,
                successful: 1,
                failed: 1,
                cache_hits: 0,
                available_domains: 0,
            });

            expect(body.results[0]?.success).toBe(true);
            expect(body.results[1]?.success).toBe(false);
            expect(body.results[1]?.error).toBe('Invalid domain format');
        });

        it('should handle service errors gracefully', async () => {
            spyOn(bulkService, 'processBulk').mockRejectedValue(new Error('Service unavailable'));

            const request: BulkWhoisRequest = {
                domains: ['example.com'],
            };

            const response = await honoApp.request('/api/v1/bulk/whois', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    apiKey: AuthService.testApiKey,
                },
                body: JSON.stringify(request),
            });

            expect(response.status).toBe(500);
            const body = (await response.json()) as BulkWhoisResponse;
            expect(body.success).toBe(false);
            expect(body.message).toBe('Service unavailable');
        });

        it('should validate options constraints', async () => {
            const request: BulkWhoisRequest = {
                domains: ['example.com'],
                options: {
                    max_concurrent: 15, // Should be rejected as > 10
                },
            };

            const response = await honoApp.request('/api/v1/bulk/whois', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    apiKey: AuthService.testApiKey,
                },
                body: JSON.stringify(request),
            });

            expect(response.status).toBe(400);
            const body = (await response.json()) as BulkWhoisResponse;
            expect(body.success).toBe(false);
            expect(body.message).toContain('max_concurrent');
        });

        it('should accept valid options', async () => {
            spyOn(bulkService, 'processBulk').mockResolvedValue([
                {
                    domain: 'example.com',
                    success: true,
                    tld: 'com',
                    available: true,
                    cache_hit: false,
                    processing_time_ms: 100,
                },
            ]);

            const request: BulkWhoisRequest = {
                domains: ['example.com'],
                options: {
                    skip_availability_check: true,
                    max_concurrent: 5,
                },
            };

            const response = await honoApp.request('/api/v1/bulk/whois', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    apiKey: AuthService.testApiKey,
                },
                body: JSON.stringify(request),
            });

            expect(response.status).toBe(200);
            const body = (await response.json()) as BulkWhoisResponse;
            expect(body.success).toBe(true);

            expect(bulkService.processBulk).toHaveBeenCalledWith(['example.com'], {
                skip_availability_check: true,
                max_concurrent: 5,
            });
        });
    });
});
