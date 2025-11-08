import { appContainer } from '@app/config';
import { AppLogger } from '@app/utils/createContainer';
import { Hono } from 'hono';

const healthRoutes = new Hono();

healthRoutes.get('/health', async (c) => {
    const logger = appContainer.resolve(AppLogger);
    logger.debug('Health check requested');

    return c.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
    });
});

export { healthRoutes };
