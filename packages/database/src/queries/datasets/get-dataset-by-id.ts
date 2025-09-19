import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { datasets } from '../../schema';

/**
 * Parameters for getting a dataset by ID
 */
const GetDatasetByIdParamsSchema = z.object({
  datasetId: z.string().uuid().describe('Dataset UUID'),
});

type GetDatasetByIdParams = z.infer<typeof GetDatasetByIdParamsSchema>;

/**
 * Get a dataset by its ID
 * Returns the dataset with all fields including ymlFile content
 */
export async function getDatasetById(params: GetDatasetByIdParams) {
  const validated = GetDatasetByIdParamsSchema.parse(params);

  const conditions = [eq(datasets.id, validated.datasetId)];

  conditions.push(isNull(datasets.deletedAt));

  const result = await db
    .select()
    .from(datasets)
    .where(and(...conditions))
    .limit(1);

  return result[0] || null;
}

/**
 * Type representing a dataset from the database
 */
export type Dataset = typeof datasets.$inferSelect;
