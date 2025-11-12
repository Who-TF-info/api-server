import type { UserEntity } from '@app/database/entities/UserEntity';
import type { AuthResponse } from '@who-tf-info/shared';

export const createAuthResponse = (user: UserEntity): AuthResponse => ({
    success: true,
    user: {
        id: user.id,
        name: user.name,
        isActive: user.isActive,
        lastRequestAt: user.lastRequestAt ?? null, // Convert undefined to null
        totalRequests: user.totalRequests,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    },
});
