import { z } from 'zod';

export const DatabaseConfig = z.object({
    url: z.string().refine((val) => {
        if (val.startsWith('sqlite://')) {
            // Custom validation for SQLite URLs
            return val.match(/^sqlite:\/\/([^?]+)(\?.*)?$/);
        }
        // Standard URL validation for other databases
        try {
            new URL(val);
            return true;
        } catch {
            return false;
        }
    }, 'Must be a valid database URL'),
});

export type DatabaseConfig = z.infer<typeof DatabaseConfig>;
