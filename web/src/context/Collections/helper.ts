import type { BusterCollection } from '@/api/asset_interfaces';

export const canEditCollection = (collection: BusterCollection) => {
  return collection.permission === 'owner' || collection.permission === 'editor';
};
