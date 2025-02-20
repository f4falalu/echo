import { appContentHeaderHeight } from '@/components/ui/layout';
import { createStyles } from 'antd-style';
import React from 'react';
import { CollapseFileButton } from './CollapseFileButton';
import { FileType } from '@/api/asset_interfaces';
import { FileContainerSegmentProps, FileContainerButtonsProps } from './interfaces';
import { ValueContainerHeaderButtons } from './ValueContainerHeaderButtons';
import { TermContainerHeaderButtons } from './TermContainerHeaderButtons';
import { DatasetContainerHeaderButtons } from './DatasetContainerHeaderButtons';
import { ValueContainerHeaderSegment } from './ValueContainerHeaderSegment';
import { TermContainerHeaderSegment } from './TermContainerHeaderSegment';
import { DatasetContainerHeaderSegment } from './DatasetContainerHeaderSegment';
import { CollectionContainerHeaderButtons } from './CollectionContainerHeaderButtons';
import { CollectionContainerHeaderSegment } from './CollectionContainerHeaderSegment';
import { DashboardContainerHeaderButtons } from './DashboardContainerHeaderButtons';
import { DashboardContainerHeaderSegment } from './DashboardContainerHeaderSegment';
import { MetricContainerHeaderSegment } from './MetricContainerHeaderSegment';
import { MetricContainerHeaderButtons } from './MetricContainerHeaderButtons';
import { useChatLayoutContextSelector } from '../../ChatLayoutContext';
import { ReasoningContainerHeaderSegment } from './ReasoningContainerHeaderSegment';

export const FileContainerHeader: React.FC = React.memo(() => {
  const { styles, cx } = useStyles();
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
        : () => <></>,
    [selectedFileType]
  );

  const SelectedFileButtons = React.useMemo(
    () =>
      selectedFileType && SelectedFileButtonsRecord[selectedFileType]
        ? SelectedFileButtonsRecord[selectedFileType]
        : () => <></>,
    [selectedFileType]
  );

  return (
    <div
      className={cx(
        styles.container,
        'flex w-full items-center justify-between space-x-1 overflow-hidden px-3'
      )}>
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
    </div>
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

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    min-height: ${appContentHeaderHeight}px;
    height: ${appContentHeaderHeight}px;
    border-bottom: 0.5px solid ${token.colorBorder};
  `
}));
