import { BaseLoggableService } from '@app/services/core/BaseLoggableService';
import type Keyv from '@keyvhq/core';
import type { Logger } from 'pino';

export abstract class BaseCacheableService extends BaseLoggableService {
    protected cache: Keyv;

    protected constructor(logger: Logger, cache: Keyv) {
        super(logger);
        this.cache = cache;
    }

    protected async rememberCache<T = unknown>(cacheKey: string, func: () => Promise<T>, ttlMs = 1000): Promise<T> {
        const cached = await this.cache.get(cacheKey);
        if (cached !== undefined) {
            return cached as T;
        }

        const result = await func();
        await this.cache.set(cacheKey, result, ttlMs);
        return result;
    }

    protected async rememberCacheWithHitInfo<T = unknown>(
        cacheKey: string,
        func: () => Promise<T>,
        ttlMs = 1000
    ): Promise<(T & { isCached: boolean }) | null> {
        const cached = await this.cache.get(cacheKey);
        if (cached !== undefined) {
            if (cached === null) {
                return null;
            }
            return { ...(cached as T), isCached: true };
        }

        const result = await func();
        await this.cache.set(cacheKey, result, ttlMs);

        if (result === null) {
            return null;
        }

        return { ...result, isCached: false };
    }
}
