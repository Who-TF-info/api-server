import type { UserEntity } from '@app/database/entities';
import type { BaseApiResponse } from '@app/types/responses/BaseResponse';

export interface AuthResponse extends BaseApiResponse {
    success: true;
    user: UserEntity;
}

export const createAuthResponse = (user: UserEntity): AuthResponse => ({
    success: true,
    user,
});
