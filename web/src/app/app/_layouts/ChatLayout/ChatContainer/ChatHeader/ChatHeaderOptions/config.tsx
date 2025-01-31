import type { FileType } from '@/api/asset_interfaces';
import { AppMaterialIcons } from '@/components/icons';
import type { MenuProps } from 'antd';

export const HeaderOptionsRecord: Record<FileType, () => MenuProps['items']> = {
  dataset: () => [
    {
      label: 'Delete',
      key: 'delete',
      icon: <AppMaterialIcons icon="delete" />
    }
  ],
  collection: () => [
    {
      label: 'Delete',
      key: 'delete',
      icon: <AppMaterialIcons icon="delete" />
    }
  ],
  metric: () => [
    {
      label: 'Delete',
      key: 'delete',
      icon: <AppMaterialIcons icon="delete" />
    }
  ],
  dashboard: () => [
    {
      label: 'Delete',
      key: 'delete',
      icon: <AppMaterialIcons icon="delete" />
    }
  ],
  term: () => [],
  value: () => []
};
