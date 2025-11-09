import type { BaseApiResponse } from './BaseResponse';

export interface HealthResponse extends BaseApiResponse {
    success: true;
    status: 'healthy' | 'unhealthy';
    timestamp: string;
}

export const createHealthResponse = (): HealthResponse => ({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
});
