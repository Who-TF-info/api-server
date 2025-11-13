import type {
    AuthResponse,
    BulkWhoisRequest,
    BulkWhoisResponse,
    ErrorResponse,
    HealthResponse,
    WhoisResponse,
} from '@who-tf-info/shared';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import { isAxiosError } from 'axios';
import type { WhoTfApiClientOptions } from './types';
import { WhoTfApiError } from './WhoTfApiError';

/**
 * Who-TF.info API Client
 *
 * TypeScript HTTP client for interacting with Who-TF.info API services.
 * Provides domain WHOIS lookup, availability checking, and bulk processing.
 */
export class WhoTfApiClient {
    protected httpClient: AxiosInstance;
    protected baseUrl: string;
    protected apiKey: string;

    constructor({ baseUrl, httpClient, apiKey }: WhoTfApiClientOptions) {
        this.baseUrl = baseUrl.replace(/\/+$/, ''); // Remove all trailing slashes
        this.httpClient = httpClient;
        this.apiKey = apiKey;

        // Set default headers
        this.httpClient.defaults.headers.common['X-API-Key'] = this.apiKey;
        this.httpClient.defaults.headers.common.Accept = 'application/json';
        this.httpClient.defaults.headers.common['Content-Type'] = 'application/json';
    }

    protected async makeRequest<T>(
        method: AxiosRequestConfig['method'],
        path: string,
        extras?: Omit<AxiosRequestConfig, 'method' | 'url'>
    ): Promise<T> {
        try {
            const requestConfig = {
                ...extras,
                method,
                url: this.getApiUrl(path),
            };
            const response = await this.httpClient.request<T>(requestConfig);

            return response.data;
        } catch (error) {
            // Check if it's an AxiosError with a response containing API error data
            if (isAxiosError(error) && error.response?.data) {
                const errorData = error.response.data;

                // Check if the error response matches our API's ErrorResponse structure
                if (this.isApiErrorResponse(errorData)) {
                    throw new WhoTfApiError(errorData, error.response.status);
                }
            }

            // For non-API errors (network issues, timeouts, etc.), re-throw as-is
            throw error;
        }
    }

    /**
     * Type guard to check if response data matches our API's ErrorResponse structure
     */
    private isApiErrorResponse(data: unknown): data is ErrorResponse {
        return (
            typeof data === 'object' &&
            data !== null &&
            'success' in data &&
            'error' in data &&
            (data as Record<string, unknown>).success === false &&
            typeof (data as Record<string, unknown>).error === 'string'
        );
    }
    /**
     * Check API health status
     * @returns Promise<HealthResponse>
     */
    getHealth(): Promise<HealthResponse> {
        return this.get<HealthResponse>('/health');
    }

    /**
     * Authenticate with API key and get user information
     * @returns Promise<AuthResponse>
     */
    authenticate(): Promise<AuthResponse> {
        return this.get<AuthResponse>('/auth');
    }

    /**
     * Check if a domain is available for registration
     * @param domain - Domain name to check (e.g., 'example.com')
     * @returns Promise<WhoisResponse>
     */
    checkDomainAvailability(domain: string): Promise<WhoisResponse> {
        if (!this.isValidDomain(domain)) {
            throw new Error(`Invalid domain name format: ${domain}`);
        }

        return this.get<WhoisResponse>(`/whois/${encodeURIComponent(domain)}`, {
            params: { availability_only: true },
        });
    }

    /**
     * Get comprehensive WHOIS data for a domain
     * @param domain - Domain name to lookup (e.g., 'example.com')
     * @returns Promise<WhoisResponse>
     */
    getWhoisData(domain: string): Promise<WhoisResponse> {
        if (!this.isValidDomain(domain)) {
            throw new Error(`Invalid domain name format: ${domain}`);
        }

        return this.get<WhoisResponse>(`/whois/${encodeURIComponent(domain)}`);
    }

    /**
     * Process multiple domains in a single bulk request
     * @param domains - Array of domain names to process
     * @param options - Optional bulk processing configuration
     * @returns Promise<BulkWhoisResponse>
     */
    bulkWhoisLookup(domains: string[], options?: BulkWhoisRequest['options']): Promise<BulkWhoisResponse> {
        // Validate input
        if (!Array.isArray(domains) || domains.length === 0) {
            throw new Error('Domains array cannot be empty');
        }

        if (domains.length > 100) {
            throw new Error('Maximum 100 domains allowed per request');
        }

        // Validate each domain
        for (const domain of domains) {
            if (!this.isValidDomain(domain)) {
                throw new Error(`Invalid domain name format: ${domain}`);
            }
        }

        // Prepare request payload
        const payload: BulkWhoisRequest = { domains };
        if (options) {
            payload.options = options;
        }

        return this.post<BulkWhoisResponse>('/bulk/whois', payload);
    }

    /**
     * Get the full API URL for a given path
     * @param path - API endpoint path
     * @returns Full URL string
     */
    protected getApiUrl(path: string): string {
        return `${this.baseUrl}/api/v1${path}`;
    }

    /**
     * Helper method for GET requests
     */
    protected get<T>(path: string, config?: Omit<AxiosRequestConfig, 'method' | 'url'>): Promise<T> {
        return this.makeRequest<T>('GET', path, config);
    }

    /**
     * Helper method for POST requests
     */
    protected post<T>(
        path: string,
        data?: unknown,
        config?: Omit<AxiosRequestConfig, 'method' | 'url' | 'data'>
    ): Promise<T> {
        return this.makeRequest<T>('POST', path, { ...config, data });
    }

    /**
     * Validate domain name format
     * @param domain - Domain name to validate
     * @returns boolean
     */
    protected isValidDomain(domain: string): boolean {
        // Basic domain validation - more permissive to handle various domain formats
        if (!domain || domain.length === 0 || domain.length > 253) {
            return false;
        }

        // Check for invalid characters at the beginning or end
        if (domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) {
            return false;
        }

        // Check for invalid characters
        if (!/^[a-zA-Z0-9.-]+$/.test(domain)) {
            return false;
        }

        // Must have at least one dot (TLD separator)
        if (!domain.includes('.')) {
            return false;
        }

        // Split into parts and validate each label
        const labels = domain.split('.');
        if (labels.length < 2) {
            return false;
        }

        // Validate each label
        for (const label of labels) {
            if (!label || label.length === 0 || label.length > 63) {
                return false;
            }
            if (label.startsWith('-') || label.endsWith('-')) {
                return false;
            }
            if (!/^[a-zA-Z0-9-]+$/.test(label)) {
                return false;
            }
        }

        // Last label (TLD) should be at least 1 character and contain letters
        const tld = labels[labels.length - 1];
        if (!tld || tld.length < 1 || !/[a-zA-Z]/.test(tld)) {
            return false;
        }

        return true;
    }
}
