import { authRoutes } from '@app/routes/auth';
import { bulkRoutes } from '@app/routes/bulk';
import { healthRoutes } from '@app/routes/health';
import { whoisRoutes } from '@app/routes/whois';
import type { AppEnv } from '@app/types/HonoEnvContext';
import { Hono } from 'hono';

const appRoutes = new Hono<AppEnv>();

appRoutes.route('/health', healthRoutes);
appRoutes.route('/auth', authRoutes);
appRoutes.route('/whois', whoisRoutes);
appRoutes.route('/bulk', bulkRoutes);

export { appRoutes };
