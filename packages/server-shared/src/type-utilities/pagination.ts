import { z } from 'zod';

export const PaginationSchema = z.object({
  page: z.number(),
  page_size: z.number(),
  total: z.number(),
  total_pages: z.number(),
});

export type Pagination = z.infer<typeof PaginationSchema>;

export const PaginatedResponseSchema = <T>(schema: z.ZodType<T>) =>
  z.object({
    data: z.array(schema),
    pagination: PaginationSchema,
  });

export type PaginatedResponse<T> = z.infer<ReturnType<typeof PaginatedResponseSchema<T>>>;
