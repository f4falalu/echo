'use client';

import React from 'react';
import { CollapseFileButton } from './CollapseFileButton';
import type { FileType } from '@/api/asset_interfaces';
import { FileContainerSegmentProps, FileContainerButtonsProps } from './interfaces';
import { DashboardContainerHeaderButtons } from './DashboardContainerHeaderButtons';
import { DashboardContainerHeaderSegment } from './DashboardContainerHeaderSegment';
import { MetricContainerHeaderSegment } from './MetricContainerHeaderSegment';
import { MetricContainerHeaderButtons } from './MetricContainerHeaderButtons';
import { useChatLayoutContextSelector } from '../../ChatLayoutContext';
import { ReasoningContainerHeaderSegment } from './ReasoningContainerHeaderSegment';

export const FileContainerHeader: React.FC = React.memo(() => {
  const selectedFileType = useChatLayoutContextSelector((x) => x.selectedFileType);
  const selectedFileView = useChatLayoutContextSelector((x) => x.selectedFileView);
  const onCollapseFileClick = useChatLayoutContextSelector((state) => state.onCollapseFileClick);
  const collapseDirection = useChatLayoutContextSelector((state) => state.collapseDirection);
  const isCollapseOpen = useChatLayoutContextSelector((state) => state.isCollapseOpen);
  const renderViewLayoutKey = useChatLayoutContextSelector((state) => state.renderViewLayoutKey);

  const showCollapseButton = renderViewLayoutKey !== 'file';

  const SelectedFileSegment = React.useMemo(
    () =>
      selectedFileType && SelectedFileSegmentRecord[selectedFileType]
        ? SelectedFileSegmentRecord[selectedFileType]
        : () => <>no segment</>,
    [selectedFileType]
  );

  const SelectedFileButtons = React.useMemo(
    () =>
      selectedFileType && SelectedFileButtonsRecord[selectedFileType]
        ? SelectedFileButtonsRecord[selectedFileType]
        : () => <>no buttons</>,
    [selectedFileType]
  );

  return (
    <>
      <div className="flex items-center gap-1.5">
        <CollapseFileButton
          collapseDirection={collapseDirection}
          showCollapseButton={showCollapseButton}
          isOpen={isCollapseOpen}
          onCollapseFileClick={onCollapseFileClick}
        />
        {selectedFileView && <SelectedFileSegment selectedFileView={selectedFileView} />}
      </div>
      <SelectedFileButtons selectedFileView={selectedFileView} />
    </>
  );
});

FileContainerHeader.displayName = 'FileContainerHeader';

const SelectedFileButtonsRecord: Record<FileType, React.FC<FileContainerButtonsProps>> = {
  metric: MetricContainerHeaderButtons,
  dashboard: DashboardContainerHeaderButtons,
  reasoning: () => null
  // value: ValueContainerHeaderButtons,
  // term: TermContainerHeaderButtons,
  // dataset: DatasetContainerHeaderButtons,
  // collection: CollectionContainerHeaderButtons
};

const SelectedFileSegmentRecord: Record<FileType, React.FC<FileContainerSegmentProps>> = {
  metric: MetricContainerHeaderSegment,
  dashboard: DashboardContainerHeaderSegment,
  reasoning: ReasoningContainerHeaderSegment
  // value: ValueContainerHeaderSegment,
  // term: TermContainerHeaderSegment,
  // dataset: DatasetContainerHeaderSegment,
  // collection: CollectionContainerHeaderSegment
};
