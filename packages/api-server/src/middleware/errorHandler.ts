import { appContainer } from '@app/config';
import { AppLogger } from '@app/utils/createContainer';
import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

export const errorHandler: ErrorHandler = (err, c) => {
    const logger = appContainer.resolve(AppLogger);
    const requestId = c.get('requestId');

    if (err instanceof HTTPException) {
        logger.warn(
            {
                requestId,
                status: err.status,
                message: err.message,
                path: c.req.path,
                method: c.req.method,
            },
            'HTTP exception occurred'
        );
        return err.getResponse();
    }

    logger.error(
        {
            requestId,
            error: err,
            path: c.req.path,
            method: c.req.method,
            stack: err instanceof Error ? err.stack : undefined,
        },
        'Unhandled error occurred'
    );

    return c.json(
        {
            error: 'Internal Server Error',
            requestId,
        },
        500
    );
};
