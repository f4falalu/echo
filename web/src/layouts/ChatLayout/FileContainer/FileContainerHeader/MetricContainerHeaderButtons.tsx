import React from 'react';
import { FileContainerButtonsProps } from './interfaces';
import { MetricFileViewSecondary, useChatLayoutContextSelector } from '../../ChatLayoutContext';
import { useMemoizedFn } from '@/hooks';
import { useChatIndividualContextSelector } from '../../ChatContext';
import { HideButtonContainer } from './HideButtonContainer';
import { FileButtonContainer } from './FileButtonContainer';
import { CreateChatButton } from './CreateChatButtont';
import { SelectableButton } from './SelectableButton';
import { SaveMetricToCollectionButton } from '../../../../components/features/buttons/SaveMetricToCollectionButton';
import { SaveMetricToDashboardButton } from '../../../../components/features/buttons/SaveMetricToDashboardButton';
import { ShareMetricButton } from '../../../../components/features/buttons/ShareMetricButton';
import { Code3, SquareChartPen } from '@/components/ui/icons';
import { useMetricIndividual } from '@/api/buster_rest/metrics';

export const MetricContainerHeaderButtons: React.FC<FileContainerButtonsProps> = React.memo(() => {
  const renderViewLayoutKey = useChatLayoutContextSelector((x) => x.renderViewLayoutKey);
  const selectedFileId = useChatIndividualContextSelector((x) => x.selectedFileId)!;
  const metricId = selectedFileId;
  const { isMetricFetched } = useMetricIndividual({ metricId });

  if (!isMetricFetched) return null;

  return (
    <FileButtonContainer>
      <EditChartButton />
      <EditSQLButton />
      <SaveToCollectionButton metricId={metricId} />
      <SaveToDashboardButton />
      <ShareMetricButton metricId={metricId} />
      <HideButtonContainer show={renderViewLayoutKey === 'file'}>
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
      icon={<SquareChartPen />}
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
      icon={<Code3 />}
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
