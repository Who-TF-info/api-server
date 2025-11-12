import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import { honoApp } from '@app/http-server';
import type { HealthResponse } from '@who-tf-info/shared';
import { integrationTestHelper } from '../../helpers/integration-helper';

describe('Health Routes Integration', () => {
    beforeAll(async () => {
        await integrationTestHelper.setup();
    });

    beforeEach(async () => {
        await integrationTestHelper.resetTestData();
    });

    afterAll(async () => {
        await integrationTestHelper.cleanup();
    });

    describe('GET /api/v1/health', () => {
        it('should return healthy status with timestamp', async () => {
            const response = await honoApp.request('/api/v1/health', {
                method: 'GET',
            });

            expect(response.status).toBe(200);

            const body = (await response.json()) as HealthResponse & { requestId: string };

            // Verify response structure matches typed interface
            expect(body).toEqual({
                success: true,
                status: 'healthy',
                timestamp: expect.any(String),
                requestId: expect.any(String),
            });

            // Verify timestamp is a valid ISO string
            expect(() => new Date(body.timestamp)).not.toThrow();
            expect(new Date(body.timestamp).getTime()).toBeGreaterThan(Date.now() - 5000); // Within last 5 seconds

            // Verify requestId is a valid UUID
            expect(body.requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
        });

        it('should have correct content-type header', async () => {
            const response = await honoApp.request('/api/v1/health');

            expect(response.headers.get('content-type')).toMatch(/application\/json/);
        });

        it('should include request tracking headers', async () => {
            const response = await honoApp.request('/api/v1/health');

            // Should have CORS headers if configured
            expect(response.headers.get('access-control-allow-origin')).toBeDefined();
        });
    });
});
