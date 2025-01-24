import { AppMaterialIcons } from '@/components/icons';
import type { AppChatMessageFileType } from '@/components/messages/AppChatMessageContainer';
import { MenuProps } from 'antd';

export const HeaderOptionsRecord: Record<AppChatMessageFileType, () => MenuProps['items']> = {
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
  ]
};
