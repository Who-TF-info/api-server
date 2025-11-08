import { describe, expect, it } from 'bun:test';
import { createCacheStore } from '@app/utils/createCacheStore';

describe('createCacheStore', () => {
    describe('cache creation logic', () => {
        it('should create Keyv instance when cacheUrl is empty', () => {
            const cache = createCacheStore('');

            expect(cache).toBeDefined();
            expect(cache.constructor.name).toBe('Keyv');
        });

        it('should create Keyv instance when cacheUrl is provided', () => {
            const cache = createCacheStore('redis://localhost:6379');

            expect(cache).toBeDefined();
            expect(cache.constructor.name).toBe('Keyv');
        });

        it('should create Keyv instance for any cacheUrl parameter', () => {
            const cache1 = createCacheStore('redis://localhost:6379');
            const cache2 = createCacheStore('invalid-url');
            const cache3 = createCacheStore('');

            expect(cache1).toBeDefined();
            expect(cache1.constructor.name).toBe('Keyv');
            expect(cache2).toBeDefined();
            expect(cache2.constructor.name).toBe('Keyv');
            expect(cache3).toBeDefined();
            expect(cache3.constructor.name).toBe('Keyv');
        });
    });
});
