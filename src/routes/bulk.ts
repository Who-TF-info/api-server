import { appContainer } from '@app/config';
import { authMiddleware } from '@app/middleware/authMiddleware';
import { BulkWhoisService } from '@app/services/BulkWhoisService';
import { RequestLogger } from '@app/services/RequestLogger';
import { TldExtractor } from '@app/services/TldExtractor';
import type { AppEnv } from '@app/types/HonoEnvContext';
import type { BulkWhoisRequest } from '@app/types/responses/BulkWhoisResponse';
import { createBulkWhoisErrorResponse, createBulkWhoisResponse } from '@app/types/responses/BulkWhoisResponse';
import { Hono } from 'hono';
import { validator } from 'hono/validator';
import { z } from 'zod';

const bulkRoutes = new Hono<AppEnv>();

// Apply auth middleware to all bulk routes
bulkRoutes.use('*', authMiddleware);

// Validation schema for bulk WHOIS request
const BulkWhoisRequestSchema = z.object({
    domains: z
        .array(z.string().min(1).max(255))
        .min(1, 'At least one domain is required')
        .max(100, 'Maximum 100 domains allowed per request'),
    options: z
        .object({
            skip_availability_check: z.boolean().optional(),
            max_concurrent: z.number().int().min(1).max(10).optional(),
        })
        .optional(),
});

bulkRoutes.post(
    '/whois',
    validator('json', (value, c) => {
        try {
            return BulkWhoisRequestSchema.parse(value);
        } catch (error) {
            if (error instanceof z.ZodError) {
                const firstError = error.errors[0];
                return c.json(
                    createBulkWhoisErrorResponse(
                        firstError
                            ? `Validation error: ${firstError.path.join('.')} - ${firstError.message}`
                            : 'Validation error'
                    ),
                    400
                );
            }
            return c.json(createBulkWhoisErrorResponse('Invalid request format'), 400);
        }
    }),
    async (c) => {
        const bulkService = appContainer.resolve(BulkWhoisService);
        const requestLogger = appContainer.resolve(RequestLogger);
        const tldExtractor = appContainer.resolve(TldExtractor);

        // Get authenticated user from context
        const user = c.get('user');
        if (!user) {
            throw new Error('User not found in context - auth middleware issue');
        }

        const requestData: BulkWhoisRequest = c.req.valid('json');
        const startTime = Date.now();

        let statusCode = 200;
        let errorCode: string | undefined;
        let errorMessage: string | undefined;

        try {
            // Process bulk WHOIS lookups
            const results = await bulkService.processBulk(requestData.domains, requestData.options);
            const totalProcessingTime = Date.now() - startTime;

            // Create response
            const response = createBulkWhoisResponse(results, totalProcessingTime);

            // Calculate aggregate metrics for logging
            const _successful = results.filter((r) => r.success).length;
            const cacheHits = results.filter((r) => r.cache_hit === true).length;
            const totalCacheableResults = results.filter((r) => r.success && r.available === false).length;
            const aggregateCacheHitRate = totalCacheableResults > 0 ? cacheHits / totalCacheableResults : 0;

            // Log the bulk request with summary metrics
            // We'll use the first domain for extraction info, as this is for aggregate logging
            const firstValidDomain = requestData.domains.find((d) => d && d.trim().length > 0);
            let extraction = null;
            if (firstValidDomain) {
                try {
                    extraction = await tldExtractor.extractDomainInfo(firstValidDomain);
                } catch {
                    extraction = {
                        domainName: 'bulk-operation',
                        tld: 'bulk',
                        isValid: true,
                    };
                }
            }

            const fallbackExtraction = extraction || {
                domainName: 'bulk-operation',
                tld: 'bulk',
                isValid: true,
            };

            await requestLogger.saveRequest(
                c,
                user,
                fallbackExtraction,
                null, // Bulk requests don't have a single WhoisData object
                'bulk',
                statusCode,
                undefined,
                undefined,
                aggregateCacheHitRate > 0
            );

            return c.json(response);
        } catch (error) {
            statusCode = 500;
            errorCode = 'BULK_PROCESSING_ERROR';
            errorMessage = error instanceof Error ? error.message : 'Unknown bulk processing error';

            // Log error request
            const fallbackExtraction = {
                domainName: 'bulk-operation',
                tld: 'bulk',
                isValid: false,
            };

            await requestLogger.saveRequest(
                c,
                user,
                fallbackExtraction,
                null,
                'bulk',
                statusCode,
                errorCode,
                errorMessage,
                false
            );

            return c.json(createBulkWhoisErrorResponse(errorMessage), 500);
        }
    }
);

export { bulkRoutes };
