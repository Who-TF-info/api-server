import type { UsersRepoService } from '@app/database/db-service/UsersRepoService';
import type { UserEntity } from '@app/database/entities/UserEntity';
import type { AppContext } from '@app/types/HonoEnvContext';
import { NodeEnv } from '@app/types/node';
import type { Logger } from 'pino';

export class AuthService {
    static testApiKey = 'tk_test_3a4b5c6d7e8f9g0h1i2j3k4l5m6n';
    protected usersRepo: UsersRepoService;
    protected env: NodeEnv;
    protected logger: Logger;

    constructor(env: NodeEnv, usersRepo: UsersRepoService, logger: Logger) {
        this.env = env;
        this.usersRepo = usersRepo;
        this.logger = logger.child({ module: 'AuthService' });
    }

    async userFromContext(c: AppContext): Promise<UserEntity | null> {
        await this.ensureTestUserExists();
        const apiKey = this.apiKeyFromContext(c);
        return this.userFromApiKey(apiKey);
    }

    protected apiKeyFromContext(c: AppContext): string | null {
        let apiKey = c.req.header('apiKey') || null;
        if ([NodeEnv.test, NodeEnv.development].includes(this.env) && !apiKey) {
            apiKey = c.req.query('apiKey') || null;
        }
        return apiKey;
    }

    protected async ensureTestUserExists(): Promise<void> {
        if ([NodeEnv.test, NodeEnv.development].includes(this.env)) {
            // Check if test user already exists
            const existingUser = await this.usersRepo.findOne({ apiKey: AuthService.testApiKey });

            if (!existingUser) {
                // Only create if user doesn't exist - this preserves tracking data
                const testUserData = {
                    apiKey: AuthService.testApiKey,
                    isActive: true,
                    name: 'Test User',
                    totalRequests: 0,
                    lastRequestAt: null,
                };
                await this.usersRepo.save(this.usersRepo.repository.create(testUserData));
            }
        }
    }

    protected async userFromApiKey(apiKey: string | null): Promise<UserEntity | null> {
        if (!apiKey || apiKey.trim().length === 0) {
            return null;
        }

        const user = await this.usersRepo.findOne({
            apiKey,
            isActive: true,
        });

        if (!user) {
            // Hash the API key for secure logging using Bun's built-in hashing
            const hashedKey = Bun.hash(apiKey).toString(16).substring(0, 12);
            this.logger.warn({ apiKeyHash: hashedKey }, 'Invalid API key attempt');
        }

        return user;
    }
}
