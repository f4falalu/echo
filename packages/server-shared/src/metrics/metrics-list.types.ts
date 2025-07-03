import { z } from 'zod/v4';
import { VerificationStatusSchema } from '../share';

export const MetricListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  last_edited: z.string(),
  dataset_name: z.string(),
  dataset_uuid: z.string(),
  created_by_id: z.string(),
  created_by_name: z.string(),
  created_by_email: z.string(),
  created_by_avatar: z.string(),
  status: VerificationStatusSchema,
  is_shared: z.boolean(),
});

export type MetricListItem = z.infer<typeof MetricListItemSchema>;
