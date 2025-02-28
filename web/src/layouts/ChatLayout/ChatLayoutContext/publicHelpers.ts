import type { ThoughtFileType } from '@/api/asset_interfaces';

const OPENABLE_FILES = new Set<string>(['metric', 'dashboard', 'reasoning']);

export const isOpenableFile = (type: ThoughtFileType | null): boolean => {
  if (!type) return false;
  return OPENABLE_FILES.has(type);
};
