import React from 'react';
import { FileContainerSegmentProps } from './interfaces';
import { AppSegmented } from '@/components/ui/segmented';
import { useChatLayoutContextSelector } from '../../ChatLayoutContext';
import type { FileView, MetricFileView } from '../../ChatLayoutContext/useChatFileLayout';
import { type SegmentedItem } from '@/components/ui/segmented';
import { useMemoizedFn } from 'ahooks';

const segmentOptions: { label: string; value: MetricFileView }[] = [
  { label: 'Chart', value: 'chart' },
  { label: 'Results', value: 'results' },
  { label: 'File', value: 'file' }
];

export const MetricContainerHeaderSegment: React.FC<FileContainerSegmentProps> = React.memo(
  ({ selectedFileView }) => {
    const onSetFileView = useChatLayoutContextSelector((x) => x.onSetFileView);

    const onChange = useMemoizedFn((fileView: SegmentedItem<FileView>) => {
      onSetFileView({ fileView: fileView.value });
    });

    return <AppSegmented options={segmentOptions} value={selectedFileView} onChange={onChange} />;
  }
);

MetricContainerHeaderSegment.displayName = 'MetricContainerHeaderSegment';
