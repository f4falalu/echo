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
import { useAssetCheck } from '@/api/buster_rest/assets/queryRequests';
import { FileContainerHeaderVersionHistory } from './FileContainerHeaderVersionHistory';

export const FileContainerHeader: React.FC = React.memo(() => {
  const selectedFileType = useChatLayoutContextSelector((x) => x.selectedFile?.type);
  const selectedFileView = useChatLayoutContextSelector((x) => x.selectedFileView);
  const isVersionHistoryMode = useChatLayoutContextSelector((x) => x.isVersionHistoryMode);
  const selectedFileId = useChatLayoutContextSelector((x) => x.selectedFile?.id);
  const onCollapseFileClick = useChatLayoutContextSelector((state) => state.onCollapseFileClick);
  const selectedLayout = useChatLayoutContextSelector((x) => x.selectedLayout);
  const showCollapseButton = selectedLayout === 'both';

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

  const { data: hasAccessQuery } = useAssetCheck(
    { assetId: selectedFileId, fileType: selectedFileType },
    (x) => x.has_access
  );
  const hasAccess = hasAccessQuery ?? true; // we assume access until it is revoked

  if (isVersionHistoryMode) return <FileContainerHeaderVersionHistory />;

  console.log(hasAccess, selectedFileView);

  return (
    <>
      <div className="flex items-center gap-1.5">
        <CollapseFileButton
          showCollapseButton={showCollapseButton}
          onCollapseFileClick={onCollapseFileClick}
        />
        {hasAccess && selectedFileView && (
          <SelectedFileSegment
            selectedFileView={selectedFileView}
            selectedFileId={selectedFileId}
          />
        )}
      </div>

      {hasAccess && <SelectedFileButtons selectedFileView={selectedFileView} />}
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
