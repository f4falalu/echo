'use client';

import React from 'react';
import { CollapseFileButton } from './CollapseFileButton';
import type { FileType } from '@/api/asset_interfaces/chat';
import { FileContainerSegmentProps, FileContainerButtonsProps } from './interfaces';
import { DashboardContainerHeaderButtons } from './DashboardContainerHeaderButtons';
import { DashboardContainerHeaderSegment } from './DashboardContainerHeaderSegment';
import { MetricContainerHeaderSegment } from './MetricContainerHeaderSegment';
import { MetricContainerHeaderButtons } from './MetricContainerHeaderButtons';
import { useChatLayoutContextSelector } from '../../ChatLayoutContext';
import { ReasoningContainerHeaderSegment } from './ReasoningContainerHeaderSegment';
import { FileContainerHeaderVersionHistory } from './FileContainerHeaderVersionHistory';

export const FileContainerHeader: React.FC = React.memo(() => {
  const selectedFileType = useChatLayoutContextSelector((x) => x.selectedFile?.type);
  const selectedFileView = useChatLayoutContextSelector((x) => x.selectedFileView);
  const isVersionHistoryMode = useChatLayoutContextSelector((x) => x.isVersionHistoryMode);
  const selectedFileId = useChatLayoutContextSelector((x) => x.selectedFile?.id);
  const onCollapseFileClick = useChatLayoutContextSelector((state) => state.onCollapseFileClick);
  const selectedLayout = useChatLayoutContextSelector((x) => x.selectedLayout);
  const showCollapseButton = selectedLayout === 'both';

  const chatId = useChatLayoutContextSelector((x) => x.chatId);
  const SelectedFileSegment = React.useMemo(
    () =>
      selectedFileType && SelectedFileSegmentRecord[selectedFileType]
        ? SelectedFileSegmentRecord[selectedFileType]
        : () => <></>,
    [selectedFileType]
  );

  const SelectedFileButtons = React.useMemo(
    () =>
      selectedFileType && SelectedFileButtonsRecord[selectedFileType]
        ? SelectedFileButtonsRecord[selectedFileType]
        : () => null,
    [selectedFileType]
  );

  if (isVersionHistoryMode) return <FileContainerHeaderVersionHistory />;

  return (
    <>
      <div className="flex items-center gap-1.5">
        <CollapseFileButton
          showCollapseButton={showCollapseButton}
          onCollapseFileClick={onCollapseFileClick}
        />
        {selectedFileView && (
          <SelectedFileSegment
            selectedFileView={selectedFileView}
            selectedFileId={selectedFileId}
            chatId={chatId}
          />
        )}
      </div>

      <SelectedFileButtons selectedFileView={selectedFileView} selectedFileId={selectedFileId} />
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
