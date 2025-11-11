import { createMiddleware } from 'hono/factory';

export const requestTrackingMiddleware = createMiddleware(async (c, next) => {
    // Capture start time for response timing
    c.set('requestStartTime', Date.now());

    await next();
});
