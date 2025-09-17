import type { UserSuggestedPromptsType } from '@buster/database/schema-types';

import { z } from 'zod';

export const GetSuggestedPromptsRequestSchema = z.object({
  id: z.string().uuid(),
});

export type GetSuggestedPromptsRequest = z.infer<typeof GetSuggestedPromptsRequestSchema>;
export type GetSuggestedPromptsResponse = UserSuggestedPromptsType;
