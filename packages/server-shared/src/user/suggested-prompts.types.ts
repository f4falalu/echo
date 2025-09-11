import type { UserSuggestedPromptsType } from '@buster/database';
import { UserSuggestedPromptsSchema } from '@buster/database';

import { z } from 'zod';

export const GetSuggestedPromptsRequestSchema = z.object({
  id: z.string().uuid(),
});
export const GetSuggestedPromptsResponseSchema = UserSuggestedPromptsSchema;

export type GetSuggestedPromptsRequest = z.infer<typeof GetSuggestedPromptsRequestSchema>;
export type GetSuggestedPromptsResponse = UserSuggestedPromptsType;
