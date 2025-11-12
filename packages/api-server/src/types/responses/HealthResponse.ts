import type { HealthResponse } from '@who-tf-info/shared';

export const createHealthResponse = (): HealthResponse => ({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
});
