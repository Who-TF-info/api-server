import { appContainer } from '@app/config';
import { authMiddleware } from '@app/middleware/authMiddleware';
import { BulkWhoisService } from '@app/services/BulkWhoisService';
import { RequestLogger } from '@app/services/RequestLogger';
import { type DomainExtractionInfo, TldExtractor } from '@app/services/TldExtractor';
import type { AppEnv } from '@app/types/HonoEnvContext';
import { createBulkWhoisErrorResponse, createBulkWhoisResponse } from '@app/types/responses/BulkWhoisResponse';
import { AppLogger } from '@app/utils/createContainer';
import { type BulkWhoisRequest, BulkWhoisRequestSchema } from '@who-tf-info/shared';
import { Hono } from 'hono';
import { validator } from 'hono/validator';
import { z } from 'zod';

const bulkRoutes = new Hono<AppEnv>();

// Apply auth middleware to all bulk routes
bulkRoutes.use('*', authMiddleware);

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
        const logger = appContainer.resolve(AppLogger);

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

            // Log the HTTP request first
            const requestEntity = await requestLogger.saveRequest(c, user, 'bulk', statusCode);

            // Prepare domain lookup data for batch logging
            const domainLookupData = await Promise.all(
                results.map(async (result) => {
                    let extraction: DomainExtractionInfo;
                    try {
                        extraction = await tldExtractor.extractDomainInfo(result.domain);
                    } catch (error) {
                        // Log extraction failure for observability
                        logger.error(
                            `Domain extraction failed for "${result.domain}": ${error instanceof Error ? error.message : String(error)}`
                        );
                        // Create fallback extraction for invalid domains
                        const parts = result.domain.split('.');
                        extraction = {
                            domainName: parts.slice(0, -1).join('.') || result.domain,
                            tld: parts[parts.length - 1] || 'unknown',
                            isValid: false,
                        };
                    }

                    return {
                        extraction,
                        whoisData: result.whoisData || null,
                        lookupType: 'whois' as const,
                        success: result.success,
                        processingTimeMs: result.processing_time_ms || 0,
                        cacheHit: result.cache_hit || false,
                        errorCode: result.error ? 'DOMAIN_LOOKUP_ERROR' : undefined,
                        errorMessage: result.error,
                        isAvailable: result.available,
                    };
                })
            );

            // Save all domain lookups
            await requestLogger.saveDomainLookups(requestEntity, domainLookupData);

            return c.json(response);
        } catch (error) {
            statusCode = 500;
            errorCode = 'BULK_PROCESSING_ERROR';
            errorMessage = error instanceof Error ? error.message : 'Unknown bulk processing error';

            // Log error request (HTTP level only since bulk processing failed)
            await requestLogger.saveRequest(c, user, 'bulk', statusCode, errorCode, errorMessage);

            return c.json(createBulkWhoisErrorResponse(errorMessage), 500);
        }
    }
);

export { bulkRoutes };
