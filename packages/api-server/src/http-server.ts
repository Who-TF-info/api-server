import { middlewares } from '@app/middleware';
import { errorHandler } from '@app/middleware/errorHandler';
import type { AppEnv } from '@app/types/HonoEnvContext';
import { Hono } from 'hono';
import { appRoutes } from './routes';

const honoApp = new Hono<AppEnv>();

honoApp.use(...middlewares);
honoApp.onError(errorHandler);

honoApp.route('/api/v1', appRoutes);

export { honoApp };
