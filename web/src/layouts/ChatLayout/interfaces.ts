import type { FileType } from '@/api/asset_interfaces';

export type SelectedFile = {
  id: string;
  type: FileType;
  versionNumber?: number;
};

export type ChatLayoutView = 'chat' | 'file' | 'both';
