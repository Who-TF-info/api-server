import { appContainer } from '@app/config';
import { AppLogger } from '@app/utils/createContainer';
import { createMiddleware } from 'hono/factory';

export const loggerMiddleware = createMiddleware(async (c, next) => {
    const logger = appContainer.resolve(AppLogger);
    const start = Date.now();
    const requestId = crypto.randomUUID();

    c.set('requestId', requestId);

    logger.info(
        {
            requestId,
            method: c.req.method,
            path: c.req.path,
            userAgent: c.req.header('user-agent'),
        },
        'Request started'
    );

    await next();

    const duration = Date.now() - start;
    logger.info(
        {
            requestId,
            method: c.req.method,
            path: c.req.path,
            status: c.res.status,
            duration,
        },
        'Request completed'
    );
});
