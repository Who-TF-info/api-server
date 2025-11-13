import type { ErrorResponse } from '@who-tf-info/shared';

/**
 * Custom error class for Who-TF API errors
 */
export class WhoTfApiError extends Error {
    public readonly status: number;
    public readonly code?: string;
    public readonly details?: Record<string, unknown>;
    public readonly requestId?: string;

    constructor(error: ErrorResponse, status: number) {
        super(error.error);
        this.name = 'WhoTfApiError';
        this.status = status;
        this.code = error.code;
        this.details = error.details;
        this.requestId = error.requestId;
    }
}
