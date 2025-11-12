import type { BaseApiResponse } from './base';

// Simplified user type for API responses (no internal fields)
export interface ApiUser {
    id: number;
    name: string;
    isActive: boolean;
    lastRequestAt: Date | null;
    totalRequests: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface AuthResponse extends BaseApiResponse {
    success: true;
    user: ApiUser;
}
