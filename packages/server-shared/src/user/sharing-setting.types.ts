import { sharingSettingEnum } from '@buster/database';
import { z } from 'zod/v4';

export const SharingSettingSchema = z.enum([...sharingSettingEnum.enumValues, 'none']);

export type SharingSetting = z.infer<typeof SharingSettingSchema>;
