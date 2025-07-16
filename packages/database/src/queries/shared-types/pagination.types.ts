import { z } from 'zod';

// Pagination input schema for validation
export const PaginationInputSchema = z.object({
  page: z.number().min(1).optional().default(1),
  page_size: z.number().min(1).max(1000).optional().default(250),
});

export type PaginationInput = z.infer<typeof PaginationInputSchema>;

// Pagination metadata that's returned with results
export interface PaginationMetadata {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

// Generic paginated response type
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

// Type helper for creating paginated API responses
export type WithPagination<T> = {
  [K in keyof T]: T[K];
} & {
  pagination: PaginationMetadata;
};
