import React from 'react';
import { FileContainerSegmentProps } from './interfaces';
import { AppSegmented } from '@/components/ui/segmented';
import { useChatLayoutContextSelector } from '../../ChatLayoutContext';
import type { FileView } from '../../ChatLayoutContext/useLayoutConfig';
import { type SegmentedItem } from '@/components/ui/segmented';
import { useMemoizedFn } from '@/hooks';
import { BusterRoutes, createBusterRoute } from '@/routes';

export const MetricContainerHeaderSegment: React.FC<FileContainerSegmentProps> = React.memo(
  ({ selectedFileView, chatId }) => {
    const onSetFileView = useChatLayoutContextSelector((x) => x.onSetFileView);
    const metricId = useChatLayoutContextSelector((x) => x.metricId) || '';

    const onChange = useMemoizedFn((fileView: SegmentedItem<FileView>) => {
      onSetFileView({ fileView: fileView.value });
    });

    const segmentOptions: SegmentedItem<FileView>[] = React.useMemo(() => {
      if (chatId) {
        return [
          {
            label: 'Chart',
            value: 'chart',
            link: createBusterRoute({
              route: BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART,
              chatId,
              metricId
            })
          },
          {
            label: 'Results',
            value: 'results',
            link: createBusterRoute({
              route: BusterRoutes.APP_CHAT_ID_METRIC_ID_RESULTS,
              chatId,
              metricId
            })
          },
          {
            label: 'File',
            value: 'file',
            link: createBusterRoute({
              route: BusterRoutes.APP_CHAT_ID_METRIC_ID_FILE,
              chatId,
              metricId
            })
          }
        ];
      }

      return [
        {
          label: 'Chart',
          value: 'chart',
          link: createBusterRoute({ route: BusterRoutes.APP_METRIC_ID_CHART, metricId })
        },
        {
          label: 'Results',
          value: 'results',
          link: createBusterRoute({ route: BusterRoutes.APP_METRIC_ID_RESULTS, metricId })
        },
        {
          label: 'File',
          value: 'file',
          link: createBusterRoute({ route: BusterRoutes.APP_METRIC_ID_FILE, metricId })
        }
      ];
    }, [chatId, metricId]);

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

MetricContainerHeaderSegment.displayName = 'MetricContainerHeaderSegment';
