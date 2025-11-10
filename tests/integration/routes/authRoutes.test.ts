import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import { honoApp } from '@app/http-server';
import { AuthService } from '@app/services/AuthService';
import type { AuthResponse } from '@app/types/responses/AuthResponse';
import { integrationTestHelper } from '../../helpers/integration-helper';

describe('Auth Routes Integration', () => {
    beforeAll(async () => {
        await integrationTestHelper.setup();
    });

    beforeEach(async () => {
        await integrationTestHelper.resetTestData();
    });

    afterAll(async () => {
        await integrationTestHelper.cleanup();
    });

    describe('GET /api/v1/auth', () => {
        it('should return an AuthResponse for authenticated users', async () => {
            const response = await honoApp.request('/api/v1/auth', {
                method: 'GET',
                headers: {
                    apiKey: AuthService.testApiKey,
                },
            });

            expect(response.status).toBe(200);

            const body = (await response.json()) as AuthResponse;

            // Verify response structure matches typed interface (without sensitive fields)
            expect(body).toEqual({
                success: true,
                user: expect.objectContaining({
                    isActive: true,
                    name: 'Test User',
                    id: expect.any(Number),
                    totalRequests: expect.any(Number),
                    createdAt: expect.any(String),
                    updatedAt: expect.any(String),
                }),
            });

            // Ensure sensitive fields are NOT present
            expect(body.user).not.toHaveProperty('apiKey');
        });

        it('should return 401 for unauthenticated users', async () => {
            const response = await honoApp.request('/api/v1/auth', {
                method: 'GET',
            });

            expect(response.status).toBe(401);

            // Hono's HTTPException returns plain text
            const responseText = await response.text();
            expect(responseText).toBe('Invalid or missing API key');
        });

        it('should return 401 for invalid API key', async () => {
            const response = await honoApp.request('/api/v1/auth', {
                method: 'GET',
                headers: {
                    apiKey: 'tk_invalid_9x8y7z6w5v4u3t2s1r0q9p8o',
                },
            });

            expect(response.status).toBe(401);
        });

        it('should accept API key via query param in development', async () => {
            const response = await honoApp.request(`/api/v1/auth?apiKey=${AuthService.testApiKey}`, {
                method: 'GET',
            });

            expect(response.status).toBe(200);
        });
    });
});
