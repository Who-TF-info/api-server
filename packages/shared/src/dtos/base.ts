import { z } from 'zod';

// Base DTO schema for entities with common fields
export const baseDtoSchema = z.object({
    id: z.number(),
    created: z.date(),
    updated: z.date(),
});

export type BaseDto = z.infer<typeof baseDtoSchema>;
