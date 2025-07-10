import type { teamRoleEnum } from '@buster/database'; //we import as type to avoid postgres dependency in the frontend ☹️
import { z } from 'zod';
import { SharingSettingSchema } from '../user/sharing-setting.types';

type TeamRoleBase = (typeof teamRoleEnum.enumValues)[number] | 'none';
const TeamRoleEnums: Record<TeamRoleBase, TeamRoleBase> = Object.freeze({
  none: 'none',
  manager: 'manager',
  member: 'member',
});
export const TeamRoleSchema = z.enum(
  Object.values(TeamRoleEnums) as [TeamRoleBase, ...TeamRoleBase[]]
);

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
