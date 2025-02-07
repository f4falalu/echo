import React from 'react';
import { FileContainerButtonsProps } from './interfaces';
import {
  type MetricFileView,
  MetricFileViewSecondary,
  useChatLayoutContextSelector
} from '../../ChatLayoutContext';
import { useMemoizedFn } from 'ahooks';
import { SaveMetricToCollectionButton } from '@appComponents/Buttons/SaveMetricToCollectionButton';
import { SaveMetricToDashboardButton } from '@appComponents/Buttons/SaveMetricToDashboardButton';
import { ShareMetricButton } from '@appComponents/Buttons/ShareMetricButton';
import { useChatIndividualContextSelector } from '../../ChatContext';
import { HideButtonContainer } from './HideButtonContainer';
import { FileButtonContainer } from './FileButtonContainer';
import { CreateChatButton } from './CreateChatButtont';
import { SelectableButton } from './SelectableButton';
import { useMetricFetched } from '@/context/Metrics';

export const MetricContainerHeaderButtons: React.FC<FileContainerButtonsProps> = React.memo(() => {
  const isPureFile = useChatLayoutContextSelector((x) => x.isPureFile);
  const selectedFileId = useChatIndividualContextSelector((x) => x.selectedFileId)!;
  const metricId = selectedFileId;
  const { fetched } = useMetricFetched({ metricId });

  if (!fetched) return null;

  return (
    <FileButtonContainer>
      <EditChartButton />
      <EditSQLButton />
      <SaveToCollectionButton metricId={metricId} />
      <SaveToDashboardButton />
      <ShareMetricButton metricId={metricId} />
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

const SaveToCollectionButton = React.memo(({ metricId }: { metricId: string }) => {
  return <SaveMetricToCollectionButton metricIds={[metricId]} />;
});
SaveToCollectionButton.displayName = 'SaveToCollectionButton';

const SaveToDashboardButton = React.memo(() => {
  const selectedFileId = useChatIndividualContextSelector((x) => x.selectedFileId)!;
  return <SaveMetricToDashboardButton metricIds={[selectedFileId]} />;
});
SaveToDashboardButton.displayName = 'SaveToDashboardButton';

const ShareMetricButtonLocal = React.memo(({ metricId }: { metricId: string }) => {
  return <ShareMetricButton metricId={metricId} />;
});
ShareMetricButtonLocal.displayName = 'ShareMetricButtonLocal';
