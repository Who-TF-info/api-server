import { appConfig } from '@app/config';
import { loggerMiddleware } from '@app/middleware/loggerMiddleware';
import { requestTrackingMiddleware } from '@app/middleware/requestTrackingMiddleware';
import type { MiddlewareHandler } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { trimTrailingSlash } from 'hono/trailing-slash';

export const middlewares: MiddlewareHandler[] = [
    trimTrailingSlash(),
    requestTrackingMiddleware,
    cors({
        origin: appConfig.http.corsOrigins,
    }),
    secureHeaders({
        contentSecurityPolicy: {
            defaultSrc: ["'self'"],
        },
        crossOriginEmbedderPolicy: false,
    }),
    loggerMiddleware,
];
