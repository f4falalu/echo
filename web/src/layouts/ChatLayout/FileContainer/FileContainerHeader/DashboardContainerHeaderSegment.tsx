import React from 'react';
import type { FileContainerSegmentProps } from './interfaces';
import type { DashboardFileView, FileView } from '../../ChatLayoutContext/useChatFileLayout';
import { AppSegmented } from '@/components/ui/segmented';
import { useChatLayoutContextSelector } from '../../ChatLayoutContext';
import { useMemoizedFn } from 'ahooks';
import { type SegmentedItem } from '@/components/ui/segmented';

const segmentOptions: { label: string; value: DashboardFileView }[] = [
  { label: 'Dashboard', value: 'dashboard' },
  { label: 'File', value: 'file' }
];

export const DashboardContainerHeaderSegment: React.FC<FileContainerSegmentProps> = React.memo(
  ({ selectedFileView }) => {
    const onSetFileView = useChatLayoutContextSelector((x) => x.onSetFileView);

    const onChange = useMemoizedFn((fileView: SegmentedItem) => {
      onSetFileView({ fileView: fileView as FileView });
    });

    return <AppSegmented options={segmentOptions} value={selectedFileView} onChange={onChange} />;
  }
);

DashboardContainerHeaderSegment.displayName = 'DashboardContainerHeaderSegment';
