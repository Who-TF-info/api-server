import type { AppConfig } from '@app/types/AppConfig';
import { PorkbunApiClient } from 'porkbun-api-client';

export const createPorkbunClient = (config: AppConfig): PorkbunApiClient | null => {
    const { apikey, secretApiKey } = config.porkbun;

    if (!apikey || !secretApiKey) {
        console.warn('PorkBun API credentials not configured, PorkBun client will not be available');
        return null;
    }

    try {
        return new PorkbunApiClient({
            apiKey: apikey,
            secretApiKey: secretApiKey,
        });
    } catch (error) {
        console.warn('Failed to create PorkBun client:', error);
        return null;
    }
};
