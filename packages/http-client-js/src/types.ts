import type { AxiosInstance } from 'axios';

export interface WhoTfApiClientOptions {
    httpClient: AxiosInstance;
    baseUrl: string;
    apiKey: string;
}
