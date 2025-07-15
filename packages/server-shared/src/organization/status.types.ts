import type { userOrganizationStatusEnum } from '@buster/database';
import { z } from 'zod';

type OrganizationStatusBase = (typeof userOrganizationStatusEnum.enumValues)[number];

export const OrganizationStatusEnum: Record<OrganizationStatusBase, OrganizationStatusBase> =
  Object.freeze({
    active: 'active',
    inactive: 'inactive',
    pending: 'pending',
    guest: 'guest',
  });

export const OrganizationStatusSchema = z.enum(
  Object.values(OrganizationStatusEnum) as [OrganizationStatusBase, ...OrganizationStatusBase[]]
);
