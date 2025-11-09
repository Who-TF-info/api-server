export interface BaseApiResponse {
    success: boolean;
    message?: string;
    requestId?: string;
}

export interface ErrorResponse extends BaseApiResponse {
    success: false;
    error: string;
    code?: string;
    details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> extends BaseApiResponse {
    success: true;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
