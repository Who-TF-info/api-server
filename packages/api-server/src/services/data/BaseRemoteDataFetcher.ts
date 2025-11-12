import { BaseCacheableService } from '@app/services/core/BaseCacheableService';
import type Keyv from '@keyvhq/core';
import type { Logger } from 'pino';

export type BaseRemoteDataFetcherOptions = {
    name: string;
    logger: Logger;
    cache: Keyv;
};

export abstract class BaseRemoteDataFetcher<
    TRaw = Record<string, unknown>,
    TTransformed = Record<string, unknown>,
> extends BaseCacheableService {
    readonly name: string;
    abstract remoteUrl: string;
    protected requestOptions?: BunFetchRequestInit = undefined;
    protected cacheTtl: number = 3_600_000; // 1 hour default

    protected constructor({ logger, cache, name }: BaseRemoteDataFetcherOptions) {
        super(logger.child({ module: name }), cache);
        this.name = name;
    }

    async fetch(): Promise<TTransformed> {
        const cacheKey = `${this.name}:${this.remoteUrl}`;

        // Try cache first
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            this.logger.debug({ cacheKey }, 'Cache hit for remote data');
            return cached as TTransformed;
        }

        // Fetch fresh data
        const response = await this.fetchRemoteUrl();
        const rawData = await this.parseResponse(response);
        const transformedData = this.transformData(rawData);

        // Cache the result
        await this.cache.set(cacheKey, transformedData, this.cacheTtl);
        this.logger.debug({ cacheKey, cacheTtl: this.cacheTtl }, 'Cached remote data');

        return transformedData;
    }

    protected async fetchRemoteUrl(): Promise<Response> {
        this.logger.debug(
            {
                remoteUrl: this.remoteUrl,
                requestOptions: this.requestOptions || {},
            },
            'Fetching remote url'
        );

        try {
            const res = await fetch(this.remoteUrl, this.requestOptions);
            this.logger.debug(
                {
                    status: res.status,
                    statusText: res.statusText,
                },
                'Received response from remote url'
            );

            if (!res.ok) {
                const errorMsg = `HTTP ${res.status}: ${res.statusText} when fetching ${this.remoteUrl}`;
                this.logger.error(
                    {
                        status: res.status,
                        statusText: res.statusText,
                        url: this.remoteUrl,
                    },
                    errorMsg
                );
                throw new Error(errorMsg);
            }

            return res;
        } catch (error) {
            const errorMsg = `Failed to fetch ${this.remoteUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            this.logger.error(
                {
                    url: this.remoteUrl,
                    error: error instanceof Error ? error.message : error,
                },
                errorMsg
            );
            throw new Error(errorMsg);
        }
    }

    protected async parseResponse(res: Response): Promise<TRaw> {
        try {
            const data = (await res.json()) as TRaw;
            this.logger.debug('Parsed JSON response from remote URL');
            return data;
        } catch (error) {
            const errorMsg = `Failed to parse JSON response from ${this.remoteUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            this.logger.error(
                {
                    url: this.remoteUrl,
                    error: error instanceof Error ? error.message : error,
                },
                errorMsg
            );
            throw new Error(errorMsg);
        }
    }

    protected transformData(raw: TRaw): TTransformed {
        // Default implementation - subclasses should override
        return raw as unknown as TTransformed;
    }
}
