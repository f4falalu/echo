import type { sharingSettingEnum } from '@buster/database'; //we import as type to avoid postgres dependency in the frontend ☹️
import { z } from 'zod/v4';

type SharingSettingBase = (typeof sharingSettingEnum.enumValues)[number] | 'none';

const SharingSettingEnums: Record<SharingSettingBase, SharingSettingBase> = Object.freeze({
  none: 'none',
  public: 'public',
  team: 'team',
  organization: 'organization',
});
export const SharingSettingSchema = z.enum(Object.values(SharingSettingEnums));

export type SharingSetting = z.infer<typeof SharingSettingSchema>;
