import type { FindOptionsWhere } from 'typeorm';
import { z } from 'zod';

// Zod validation schemas for runtime type checking
const OrderRecordSchema = z.record(z.string(), z.enum(['ASC', 'DESC']));
const RelationsArraySchema = z.array(z.string());
const WhereQuerySchema = z.record(z.string(), z.unknown());

export const PaginationOptionsSchema = z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(10),
    where: z.optional(WhereQuerySchema),
    order: z.optional(OrderRecordSchema),
    relations: z.optional(RelationsArraySchema),
});

export const PaginatedResultSchema = z.object({
    items: z.array(z.any()),
    pagination: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    }),
});

export interface PaginationOptions<T = Record<string, unknown>>
    extends Omit<z.infer<typeof PaginationOptionsSchema>, 'where'> {
    where?: FindOptionsWhere<T>;
}

export interface PaginatedResult<T> extends Omit<z.infer<typeof PaginatedResultSchema>, 'items'> {
    items: T[];
}
