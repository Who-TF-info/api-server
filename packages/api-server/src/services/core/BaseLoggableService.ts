import type { LevelWithSilent, Logger } from 'pino';

export abstract class BaseLoggableService {
    protected logger: Logger;

    protected constructor(logger: Logger) {
        this.logger = logger;
    }

    public set logLevel(level: LevelWithSilent) {
        this.logger.level = level;
    }
}
