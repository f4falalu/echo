import React from 'react';
import { FileContainerButtonsProps } from './interfaces';
import { Button, ButtonProps, ConfigProvider } from 'antd';
import { AppMaterialIcons, AppTooltip } from '@/components';
import {
  type MetricFileView,
  MetricFileViewSecondary,
  useChatLayoutContextSelector
} from '../../ChatLayoutContext';
import { useMemoizedFn } from 'ahooks';
import { SaveMetricToCollectionButton } from '@appComponents/Buttons/SaveMetricToCollectionButton';
import { SaveMetricToDashboardButton } from '@appComponents/Buttons/SaveMetricToDashboardButton';
import { ShareMetricButton } from '@appComponents/Buttons/ShareMetricButton';
import { useChatContextSelector } from '../../ChatContext';
import { HideButtonContainer } from './HideButtonContainer';
import { FileButtonContainer } from './FileButtonContainer';
import { CreateChatButton } from './CreateChatButtont';
import { SelectableButton } from './SelectableButton';

export const MetricContainerHeaderButtons: React.FC<FileContainerButtonsProps> = React.memo(() => {
  const selectedFileView = useChatLayoutContextSelector(
    (x) => x.selectedFileView
  ) as MetricFileView;
  const isPureFile = useChatLayoutContextSelector((x) => x.isPureFile);

  const showEditChartButton = selectedFileView === 'chart';

  return (
    <FileButtonContainer>
      <EditChartButton />
      <EditSQLButton />
      <SaveToCollectionButton />
      <SaveToDashboardButton />
      <ShareMetricButton />
      <HideButtonContainer show={isPureFile}>
        <CreateChatButton />
      </HideButtonContainer>
    </FileButtonContainer>
  );
});

MetricContainerHeaderButtons.displayName = 'MetricContainerHeaderButtons';

const EditChartButton = React.memo(() => {
  const selectedFileViewSecondary = useChatLayoutContextSelector(
    (x) => x.selectedFileViewSecondary
  );
  const onSetFileView = useChatLayoutContextSelector((x) => x.onSetFileView);
  const editableSecondaryView: MetricFileViewSecondary = 'chart-edit';
  const isSelectedView = selectedFileViewSecondary === editableSecondaryView;

  const onClickButton = useMemoizedFn(() => {
    const secondaryView = isSelectedView ? null : editableSecondaryView;
    onSetFileView({ secondaryView, fileView: 'chart' });
  });

  return (
    <SelectableButton
      tooltipText="Edit chart"
      icon="chart_edit"
      onClick={onClickButton}
      selected={isSelectedView}
    />
  );
});
EditChartButton.displayName = 'EditChartButton';

const EditSQLButton = React.memo(() => {
  const selectedFileViewSecondary = useChatLayoutContextSelector(
    (x) => x.selectedFileViewSecondary
  );
  const onSetFileView = useChatLayoutContextSelector((x) => x.onSetFileView);
  const editableSecondaryView: MetricFileViewSecondary = 'sql-edit';
  const isSelectedView = selectedFileViewSecondary === editableSecondaryView;

  const onClickButton = useMemoizedFn(() => {
    const secondaryView = isSelectedView ? null : editableSecondaryView;
    onSetFileView({ secondaryView, fileView: 'results' });
  });

  return (
    <SelectableButton
      tooltipText="Edit SQL"
      icon="code_blocks"
      onClick={onClickButton}
      selected={isSelectedView}
    />
  );
});
EditSQLButton.displayName = 'EditSQLButton';

const SaveToCollectionButton = React.memo(() => {
  const selectedFileId = useChatContextSelector((x) => x.selectedFileId)!;
  return <SaveMetricToCollectionButton metricIds={[selectedFileId]} />;
});
SaveToCollectionButton.displayName = 'SaveToCollectionButton';

const SaveToDashboardButton = React.memo(() => {
  const selectedFileId = useChatContextSelector((x) => x.selectedFileId)!;
  return <SaveMetricToDashboardButton metricIds={[selectedFileId]} />;
});
SaveToDashboardButton.displayName = 'SaveToDashboardButton';

const ShareMetricButtonLocal = React.memo(() => {
  const selectedFileId = useChatContextSelector((x) => x.selectedFileId)!;

  return <ShareMetricButton />;
});
ShareMetricButtonLocal.displayName = 'ShareMetricButtonLocal';
