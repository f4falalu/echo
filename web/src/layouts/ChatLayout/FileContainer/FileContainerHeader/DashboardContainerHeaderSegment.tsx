import React from 'react';
import type { FileContainerSegmentProps } from './interfaces';
import type { FileView } from '../../ChatLayoutContext/useChatFileLayout';
import { AppSegmented } from '@/components/ui/segmented';
import { useChatLayoutContextSelector } from '../../ChatLayoutContext';
import { useMemoizedFn } from 'ahooks';
import { type SegmentedItem } from '@/components/ui/segmented';

const segmentOptions: SegmentedItem<FileView>[] = [
  { label: 'Dashboard', value: 'dashboard' },
  { label: 'File', value: 'file' }
];

export const DashboardContainerHeaderSegment: React.FC<FileContainerSegmentProps> = React.memo(
  ({ selectedFileView }) => {
    const onSetFileView = useChatLayoutContextSelector((x) => x.onSetFileView);

    const onChange = useMemoizedFn((fileView: SegmentedItem<FileView>) => {
      onSetFileView({ fileView: fileView.value });
    });

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
