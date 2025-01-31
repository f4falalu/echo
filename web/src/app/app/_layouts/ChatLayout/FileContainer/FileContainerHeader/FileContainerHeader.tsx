import { appContentHeaderHeight } from '@/components/layout';
import { createStyles } from 'antd-style';
import React from 'react';
import { CollapseFileButton } from './CollapseFileButton';
import { FileType } from '@/api/asset_interfaces';
import { FileContainerSegmentProps, FileContainerButtonsProps } from './interfaces';
import { MetricContainerHeaderButtons } from './MetricContainerHeaderButtons';
import { ValueContainerHeaderButtons } from './ValueContainerHeaderButtons';
import { TermContainerHeaderButtons } from './TermContainerHeaderButtons';
import { DatasetContainerHeaderButtons } from './DatasetContainerHeaderButtons';
import { DashboardContainerHeaderButtons } from './DashboardContainerHeaderButtons';
import { CollectionContainerHeaderButtons } from './CollectionContainerHeaderButtons';
import { CollectionContainerHeaderSegment } from './CollectionContainerHeaderSegment';
import { MetricContainerHeaderSegment } from './MetricContainerHeaderSegment';
import { ValueContainerHeaderSegment } from './ValueContainerHeaderSegment';
import { TermContainerHeaderSegment } from './TermContainerHeaderSegment';
import { DatasetContainerHeaderSegment } from './DatasetContainerHeaderSegment';
import { DashboardContainerHeaderSegment } from './DashboardContainerHeaderSegment';

import { useChatLayoutContextSelector } from '../../ChatLayoutContext';

export const FileContainerHeader: React.FC = React.memo(() => {
  const { styles, cx } = useStyles();
  const selectedFileType = useChatLayoutContextSelector((x) => x.selectedFileType);
  const selectedFileView = useChatLayoutContextSelector((x) => x.selectedFileView);

  const showCollapseButton = true;
  const isCollapseOpen = true; //I could get the defaultSelectedLayout from the context and check if it is 'both'?

  const SelectedFileSegment = React.useMemo(
    () => (selectedFileType ? SelectedFileSegmentRecord[selectedFileType] : () => <></>),
    [selectedFileType]
  );

  const SelectedFileButtons = React.useMemo(
    () => (selectedFileType ? SelectedFileButtonsRecord[selectedFileType] : () => <></>),
    [selectedFileType]
  );

  return (
    <div
      className={cx(styles.container, 'flex w-full items-center justify-between space-x-3.5 px-3')}>
      <div className="flex items-center gap-1.5">
        <CollapseFileButton showCollapseButton={showCollapseButton} isOpen={isCollapseOpen} />
        {selectedFileView && <SelectedFileSegment selectedFileView={selectedFileView} />}
      </div>
      <SelectedFileButtons selectedFileView={selectedFileView} />
    </div>
  );
});

FileContainerHeader.displayName = 'FileContainerHeader';

const SelectedFileButtonsRecord: Record<FileType, React.FC<FileContainerButtonsProps>> = {
  metric: MetricContainerHeaderButtons,
  value: ValueContainerHeaderButtons,
  term: TermContainerHeaderButtons,
  dataset: DatasetContainerHeaderButtons,
  dashboard: DashboardContainerHeaderButtons,
  collection: CollectionContainerHeaderButtons
};

const SelectedFileSegmentRecord: Record<FileType, React.FC<FileContainerSegmentProps>> = {
  metric: MetricContainerHeaderSegment,
  value: ValueContainerHeaderSegment,
  term: TermContainerHeaderSegment,
  dataset: DatasetContainerHeaderSegment,
  dashboard: DashboardContainerHeaderSegment,
  collection: CollectionContainerHeaderSegment
};

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    min-height: ${appContentHeaderHeight}px;
    height: ${appContentHeaderHeight}px;
    border-bottom: 0.5px solid ${token.colorBorder};
  `
}));
