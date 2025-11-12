import { z } from 'zod';

// Validation schema for bulk WHOIS request
export const BulkWhoisRequestSchema = z.object({
    domains: z
        .array(z.string().min(1).max(255))
        .min(1, 'At least one domain is required')
        .max(100, 'Maximum 100 domains allowed per request'),
    options: z
        .object({
            skip_availability_check: z.boolean().optional(),
            max_concurrent: z.number().int().min(1).max(10).optional(),
        })
        .optional(),
});

export type BulkWhoisRequest = z.infer<typeof BulkWhoisRequestSchema>;
