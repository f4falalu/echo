import { SharingSettingSchema as SharingSettingSchemaDatabase } from '@buster/database/schema-types'; //we import as type to avoid postgres dependency in the frontend ☹️
import { z } from 'zod';

const SharingSettingSchema = z.union([SharingSettingSchemaDatabase, z.literal('none')]);

export { SharingSettingSchema };

export type SharingSetting = z.infer<typeof SharingSettingSchema>;
