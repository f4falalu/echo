import type { ShareRole } from '@buster/server-shared/share';

export const getIsOwner = (role: ShareRole | null | undefined) => {
  return role === 'owner';
};

export const getIsEffectiveOwner = (role: ShareRole | null | undefined) => {
  return role === 'fullAccess' || role === 'owner';
};

export const canEdit = (role: ShareRole | null | undefined) => {
  return role === 'canEdit' || role === 'fullAccess' || role === 'owner';
};

export const canShare = (role: ShareRole | null | undefined) => {
  return role === 'fullAccess' || role === 'owner';
};

export const canFilter = (role: ShareRole | null | undefined) => {
  return role === 'canFilter' || role === 'fullAccess' || role === 'owner' || role === 'canEdit';
};
