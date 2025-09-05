import type React from 'react';
import { CircleInfo } from '@/components/ui/icons';
import Code3 from '@/components/ui/icons/NucleoIconOutlined/code-3';
import SquareMenu from '@/components/ui/icons/NucleoIconOutlined/square-menu';

export enum DatasetApps {
  OVERVIEW = 'overview',
  PERMISSIONS = 'permissions',
  EDITOR = 'editor',
}

export const DataSetAppText: Record<DatasetApps, string> = {
  [DatasetApps.OVERVIEW]: 'Overview',
  [DatasetApps.PERMISSIONS]: 'Permissions',
  [DatasetApps.EDITOR]: 'Editor',
};

export const DataSetAppIcons: Record<DatasetApps, React.ReactNode> = {
  [DatasetApps.OVERVIEW]: <CircleInfo />,
  [DatasetApps.PERMISSIONS]: <SquareMenu />,
  [DatasetApps.EDITOR]: <Code3 />,
};
