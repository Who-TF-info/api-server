import { DatabaseConfig } from '@app/types/DatabaseConfig';
import { NodeEnv } from '@app/types/node';
import { z } from 'zod';

export const AppConfigSchema = z.object({
    nodeEnv: z.object({
        env: z.enum([NodeEnv.development, NodeEnv.test, NodeEnv.production]),
        isDevelopment: z.boolean(),
        isTesting: z.boolean(),
    }),
    http: z.object({
        host: z.string(),
        port: z.number(),
        corsOrigins: z.array(z.string()).optional().default([]),
    }),
    logger: z.object({
        usePretty: z.boolean().optional().default(true),
        level: z.string().optional().default('info'),
    }),
    cacheUrl: z.string().url().optional(),
    porkbun: z.object({
        apikey: z.string(),
        secretApiKey: z.string(),
    }),
    database: DatabaseConfig,
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
