import type { sharingSettingEnum } from '@buster/database'; //we import as type to avoid postgres dependency in the frontend ☹️
import { z } from 'zod';

type SharingSettingBase = (typeof sharingSettingEnum.enumValues)[number] | 'none';

const SharingSettingEnums: Record<SharingSettingBase, SharingSettingBase> = Object.freeze({
  none: 'none',
  public: 'public',
  team: 'team',
  organization: 'organization',
});

const test = Object.values(SharingSettingEnums) as [SharingSettingBase, ...SharingSettingBase[]];

export const SharingSettingSchema = z.enum(test);

export type SharingSetting = z.infer<typeof SharingSettingSchema>;
