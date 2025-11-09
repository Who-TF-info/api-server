import { appContainer } from '@app/config';
import type { AppEnv } from '@app/types/HonoEnvContext';
import { createHealthResponse } from '@app/types/responses';
import { AppLogger } from '@app/utils/createContainer';
import { Hono } from 'hono';

const healthRoutes = new Hono<AppEnv>();

healthRoutes.get('/health', async (c) => {
    const logger = appContainer.resolve(AppLogger);
    const requestId = c.get('requestId');

    logger.debug('Health check requested');

    const response = createHealthResponse();

    return c.json({
        ...response,
        requestId,
    });
});

export { healthRoutes };
