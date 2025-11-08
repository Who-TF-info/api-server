import { NodeEnv } from '@app/types/node';
import { z } from 'zod';

export const AppConfigSchema = z.object({
    nodeEnv: z.object({
        env: z.enum(NodeEnv),
        isDevelopment: z.boolean(),
        isTesting: z.boolean(),
    }),
    http: z.object({
        host: z.string(),
        port: z.number(),
    }),
    logger: z.object({
        usePretty: z.boolean().optional().default(true),
        level: z.string().optional().default('info'),
    }),
    cacheUrl: z.url(),
    porkbun: z.object({
        apikey: z.string(),
        secretApiKey: z.string(),
    }),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
