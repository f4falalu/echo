import { z } from 'zod';

export const CreateTeamRequestSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

export type CreateTeamRequest = z.infer<typeof CreateTeamRequestSchema>;

export const GetTeamListRequestSchema = z.object({
  page_size: z.number().optional(),
  page: z.number().optional(),
  permission_group_id: z.string().optional(),
  user_id: z.string().optional(),
  belongs_to: z.boolean().optional(),
});

export type GetTeamListRequest = z.infer<typeof GetTeamListRequestSchema>;
