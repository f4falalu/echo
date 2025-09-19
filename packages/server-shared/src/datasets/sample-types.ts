import { z } from 'zod';
import { DataResultSchema } from '../common/data-types';

/**
 * Request parameters for getting a dataset sample
 */
export const GetDatasetSampleParamsSchema = z.object({
  id: z.string().uuid().describe('Dataset UUID'),
});

export type GetDatasetSampleParams = z.infer<typeof GetDatasetSampleParamsSchema>;

/**
 * Response for dataset sample endpoint
 * Returns the same DataResult type used by metrics for consistency
 */
export const GetDatasetSampleResponseSchema = DataResultSchema;

export type GetDatasetSampleResponse = z.infer<typeof GetDatasetSampleResponseSchema>;
