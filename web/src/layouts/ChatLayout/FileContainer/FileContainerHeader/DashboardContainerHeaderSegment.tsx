import React, { useMemo } from 'react';
import type { FileContainerSegmentProps } from './interfaces';
import type { FileView } from '../../ChatLayoutContext/useLayoutConfig';
import { AppSegmented } from '@/components/ui/segmented';
import { useChatLayoutContextSelector } from '../../ChatLayoutContext';
import { useMemoizedFn } from '@/hooks';
import { type SegmentedItem } from '@/components/ui/segmented';
import { BusterRoutes, createBusterRoute } from '@/routes';

export const DashboardContainerHeaderSegment: React.FC<FileContainerSegmentProps> = React.memo(
  ({ selectedFileView, chatId, selectedFileId }) => {
    const onSetFileView = useChatLayoutContextSelector((x) => x.onSetFileView);

    const onChange = useMemoizedFn((fileView: SegmentedItem<FileView>) => {
      onSetFileView({ fileView: fileView.value });
    });

    const segmentOptions: SegmentedItem<FileView>[] = useMemo(() => {
      if (chatId) {
        return [
          {
            label: 'Dashboard',
            value: 'dashboard',
            link: createBusterRoute({
              route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID,
              dashboardId: selectedFileId || '',
              chatId
            })
          },
          {
            label: 'File',
            value: 'file',
            link: createBusterRoute({
              route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID,
              dashboardId: selectedFileId || '',
              chatId
            })
          }
        ];
      }

      return [
        {
          label: 'Dashboard',
          value: 'dashboard',
          link: createBusterRoute({
            route: BusterRoutes.APP_DASHBOARD_ID,
            dashboardId: selectedFileId || ''
          })
        },
        {
          label: 'File',
          value: 'file',
          link: createBusterRoute({
            route: BusterRoutes.APP_DASHBOARD_ID_FILE,
            dashboardId: selectedFileId || ''
          })
        }
      ];
    }, [chatId, selectedFileId]);

    return (
      <AppSegmented
        type="button"
        options={segmentOptions}
        value={selectedFileView}
        onChange={onChange}
      />
    );
  }
);

DashboardContainerHeaderSegment.displayName = 'DashboardContainerHeaderSegment';
