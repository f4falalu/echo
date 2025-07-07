import { teamRoleEnum } from '@buster/database';
import { z } from 'zod/v4';
import { SharingSettingSchema } from '../user/sharing-setting.types';

export const TeamRoleSchema = z.enum([...teamRoleEnum.enumValues, 'none']);

export type TeamRole = z.infer<typeof TeamRoleSchema>;

export const TeamSchema = z.object({
  id: z.string(),
  name: z.string(),
  edit_sql: z.boolean(),
  email_slack_enabled: z.boolean(),
  export_assets: z.boolean(),
  organization_id: z.string(),
  sharing_settings: SharingSettingSchema,
  upload_csv: z.boolean(),
  updated_at: z.string(),
  created_at: z.string(),
  deleted_at: z.string().nullable(),
  role: TeamRoleSchema,
});

export type Team = z.infer<typeof TeamSchema>;
