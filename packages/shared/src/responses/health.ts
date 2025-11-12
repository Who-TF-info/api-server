import type { BaseApiResponse } from './base';

export interface HealthResponse extends BaseApiResponse {
    success: true;
    status: 'healthy' | 'unhealthy';
    timestamp: string;
}
