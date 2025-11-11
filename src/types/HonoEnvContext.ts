import type { UserEntity } from '@app/database/entities';
import type { Context } from 'hono';

export type AppEnv = {
    Variables: {
        requestId: string;
        user?: UserEntity;
        requestStartTime?: number;
    };
};

export type AppContext = Context<AppEnv>;
