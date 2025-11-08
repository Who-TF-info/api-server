import Keyv from '@keyvhq/core';
import KeyvRedis from '@keyvhq/redis';

export const createCacheStore = (cacheUrl: string): Keyv => {
    try {
        return cacheUrl ? new Keyv({ store: new KeyvRedis(cacheUrl) }) : new Keyv();
    } catch (error) {
        console.warn('Failed to connect to Redis cache, falling back to in-memory cache:', error);
        return new Keyv(); // Fallback to in-memory cache
    }
};
