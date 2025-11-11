import { appContainer } from '@app/config';
import { authMiddleware } from '@app/middleware/authMiddleware';
import { TldResolver } from '@app/services/lookup/TldResolver';
import { RequestLogger } from '@app/services/RequestLogger';
import { type DomainExtractionInfo, TldExtractor } from '@app/services/TldExtractor';
import type { AppEnv } from '@app/types/HonoEnvContext';
import {
    createAvailableWhoisResponse,
    createFailedWhoisResponse,
    createSuccessWhoisResponse,
} from '@app/types/responses/WhoisResponse';
import { Hono } from 'hono';

const whoisRoutes = new Hono<AppEnv>();

// Apply auth middleware to all whois routes
whoisRoutes.use('*', authMiddleware);

whoisRoutes.get('/:domain', async (c) => {
    const resolver = appContainer.resolve(TldResolver);
    const extractor = appContainer.resolve(TldExtractor);
    const requestLogger = appContainer.resolve(RequestLogger);

    // Get authenticated user from context (set by auth middleware)
    const user = c.get('user');
    if (!user) {
        throw new Error('User not found in context - auth middleware issue');
    }

    const domain = c.req.param('domain');
    let extraction: DomainExtractionInfo | undefined;
    let statusCode = 200;
    let errorCode: string | undefined;
    let errorMessage: string | undefined;

    try {
        extraction = await extractor.extractDomainInfo(domain);

        if (!extraction.isValid) {
            statusCode = 400;
            errorCode = 'INVALID_DOMAIN';
            errorMessage = 'Invalid domain format';

            // Log invalid domain request
            await requestLogger.saveRequest(
                c,
                user,
                extraction,
                null,
                'whois',
                statusCode,
                errorCode,
                errorMessage,
                false
            );

            return c.json(createFailedWhoisResponse(domain, 'invalid domain', extraction.tld), 400);
        }

        const results = await resolver.getWhoisData(domain);

        if (results === null) {
            // Domain is available (no WHOIS data found) - use 204 status
            statusCode = 204;
            await requestLogger.saveRequest(
                c,
                user,
                extraction,
                null,
                'whois',
                statusCode,
                undefined,
                undefined,
                false
            );

            c.status(204);
            return c.json(createAvailableWhoisResponse(domain, extraction.tld));
        }

        // Successfully retrieved WHOIS data - extract cache hit info
        const { isCached, ...whoisDataWithoutCacheInfo } = results;
        await requestLogger.saveRequest(
            c,
            user,
            extraction,
            whoisDataWithoutCacheInfo,
            'whois',
            statusCode,
            undefined,
            undefined,
            isCached
        );

        return c.json(
            createSuccessWhoisResponse(domain, extraction.tld, false, {
                ...whoisDataWithoutCacheInfo,
                rawWhois: undefined,
                rawRdap: undefined,
            })
        );
    } catch (error) {
        statusCode = 500;
        errorCode = 'INTERNAL_ERROR';
        errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Log error request (use default extraction if extraction failed)
        const fallbackExtraction = extraction || {
            domainName: domain,
            tld: 'unknown',
            isValid: false,
        };

        await requestLogger.saveRequest(
            c,
            user,
            fallbackExtraction,
            null,
            'whois',
            statusCode,
            errorCode,
            errorMessage,
            false
        );

        throw error;
    }
});

export { whoisRoutes };
