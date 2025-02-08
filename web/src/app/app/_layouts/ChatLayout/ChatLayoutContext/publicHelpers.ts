import type { ThoughtFileType, FileType } from '@/api/asset_interfaces';

const OPENABLE_FILES = new Set<string>(['metric', 'dashboard', 'reasoning']);

export const isOpenableFile = (type: ThoughtFileType): boolean => {
  return OPENABLE_FILES.has(type);
};
