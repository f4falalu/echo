import type { ThoughtFileType, FileType } from '@/api/asset_interfaces';

export const isOpenableFile = (type: ThoughtFileType): type is FileType => {
  const validTypes: FileType[] = ['metric', 'dashboard'];
  return validTypes.includes(type as FileType);
};
