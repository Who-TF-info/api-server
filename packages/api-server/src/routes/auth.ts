import { authMiddleware } from '@app/middleware/authMiddleware';
import type { AppEnv } from '@app/types/HonoEnvContext';
import { createAuthResponse } from '@app/types/responses/AuthResponse';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

const authRoutes = new Hono<AppEnv>();

authRoutes.get('/', authMiddleware, async (c) => {
    const user = c.get('user');
    if (!user) {
        // This shouldn't happen if authMiddleware works correctly
        throw new HTTPException(500, { message: 'Authentication failed unexpectedly' });
    }
    return c.json(createAuthResponse(user));
});

export { authRoutes };
