import { z } from 'zod';
import { TeamSchema } from './teams.types';

export const TeamListResponseSchema = z.array(TeamSchema);

export type TeamListResponse = z.infer<typeof TeamListResponseSchema>;
