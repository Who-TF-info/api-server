import type { UserEntity } from '@app/database/entities';
import type { BaseApiResponse } from '@app/types/responses/BaseResponse';

export interface AuthResponse extends BaseApiResponse {
    success: true;
    user: Omit<UserEntity, 'apiKey'>;
}

export const createAuthResponse = (user: UserEntity): AuthResponse => ({
    success: true,
    user: {
        id: user.id,
        name: user.name,
        isActive: user.isActive,
        lastRequestAt: user.lastRequestAt,
        totalRequests: user.totalRequests,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    },
});
