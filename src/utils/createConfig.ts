import { type AppConfig, AppConfigSchema } from '@app/types/AppConfig';
import { NodeEnv } from '@app/types/node';
import { merge } from 'ts-deepmerge';

export const createConfig = (overrides?: Partial<AppConfig>): AppConfig => {
    const env = (Bun.env.NODE_ENV || NodeEnv.development) as NodeEnv;
    const isDevelopment = env === NodeEnv.development;
    const isTesting = env === NodeEnv.test;

    const appConfigEnv: AppConfig = {
        nodeEnv: {
            env,
            isDevelopment,
            isTesting,
        },
        http: {
            host: Bun.env.HTTP_HOST || 'localhost',
            port: Number(Bun.env.HTTP_PORT || 3000),
        },
        logger: {
            usePretty: isDevelopment || isTesting,
            level: Bun.env.LOGGER_LEVEL || 'info',
        },
        cacheUrl: Bun.env.CACHE_URL || 'redis://localhost',
        porkbun: {
            apikey: Bun.env.PORKBUN_API_KEY || '',
            secretApiKey: Bun.env.PORKBUN_SECRET_KEY || '',
        },
    };

    const config = merge(appConfigEnv, overrides ?? {});
    return AppConfigSchema.parse(config);
};
