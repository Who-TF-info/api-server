import { healthRoutes } from '@app/routes/health';
import type { AppEnv } from '@app/types/HonoEnvContext';
import { Hono } from 'hono';

const appRoutes = new Hono<AppEnv>();

appRoutes.route('/', healthRoutes);

export { appRoutes };
