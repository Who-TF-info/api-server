import { appContainer } from '@app/config';
import { AuthService } from '@app/services/AuthService';
import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';

export const authMiddleware = createMiddleware(async (c, next) => {
    const service = appContainer.resolve(AuthService);
    const user = await service.userFromContext(c);
    if (user) {
        c.set('user', user);
        await next();
    } else {
        throw new HTTPException(401, { message: 'Invalid or missing API key' });
    }
});
