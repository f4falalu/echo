import { Link } from '@tanstack/react-router';
import React from 'react';
import { useGetMetric } from '@/api/buster_rest/metrics';
import { CreateChatButton } from '@/components/features/AssetLayout/CreateChatButton';
import { SaveMetricToCollectionButton } from '@/components/features/buttons/SaveMetricToCollectionButton';
import { SaveMetricToDashboardButton } from '@/components/features/buttons/SaveMetricToDashboardButton';
import { ShareMetricButton } from '@/components/features/buttons/ShareMetricButton';
import { ThreeDotMenuButton } from '@/components/features/metrics/MetricThreeDotMenu';
import { SquareChartPen, Xmark } from '@/components/ui/icons';
import { useIsChatMode, useIsFileMode } from '@/context/Chats/useMode';
import { useIsMetricReadOnly } from '@/context/Metrics/useIsMetricReadOnly';
import { canEdit, getIsEffectiveOwner } from '@/lib/share';
import { FileButtonContainer } from '../FileButtonContainer';
import { HideButtonContainer } from '../HideButtonContainer';
import { SelectableButton } from '../SelectableButton';
import { useIsMetricEditMode, useMetricEditToggle } from './MetricContextProvider';

export const MetricContainerHeaderButtons: React.FC<{
  metricId: string;
  metricVersionNumber: number | undefined;
}> = React.memo(({ metricId, metricVersionNumber }) => {
  const isChatMode = useIsChatMode();
  const isFileMode = useIsFileMode();
  const { isViewingOldVersion } = useIsMetricReadOnly({
    metricId: metricId || '',
  });
  const { error: metricError, data: permission } = useGetMetric(
    { id: metricId },
    { select: (x) => x.permission }
  );

  //we assume it is fetched until it is not
  if (metricError || !permission) return null;

  const isEditor = canEdit(permission);
  const isEffectiveOwner = getIsEffectiveOwner(permission);

  return (
    <FileButtonContainer>
      {isEditor && !isViewingOldVersion && <EditChartButton />}
      {isEffectiveOwner && !isViewingOldVersion && <ShareMetricButton metricId={metricId} />}
      <ThreeDotMenuButton
        metricId={metricId}
        isViewingOldVersion={isViewingOldVersion}
        versionNumber={metricVersionNumber}
      />
      <HideButtonContainer show={isFileMode}>
        <CreateChatButton assetId={metricId} assetType="metric" />
      </HideButtonContainer>
      {isChatMode && <ClosePageButton metricId={metricId} />}
    </FileButtonContainer>
  );
});

MetricContainerHeaderButtons.displayName = 'MetricContainerHeaderButtons';

const EditChartButton = React.memo(() => {
  const isChartEditMode = useIsMetricEditMode();
  const toggleEditMode = useMetricEditToggle();

  return (
    <SelectableButton
      tooltipText="Edit chart"
      icon={<SquareChartPen />}
      data-testid="edit-chart-button"
      onClick={() => toggleEditMode()}
      selected={isChartEditMode}
    />
  );
});
EditChartButton.displayName = 'EditChartButton';

const SaveToCollectionButton = React.memo(({ metricId }: { metricId: string }) => {
  return <SaveMetricToCollectionButton metricId={metricId} />;
});
SaveToCollectionButton.displayName = 'SaveToCollectionButton';

const SaveToDashboardButton = React.memo(({ metricId }: { metricId: string }) => {
  const { data: dashboardIds } = useGetMetric(
    { id: metricId },
    { select: (x) => x.dashboards?.map((x) => x.id) }
  );

  return (
    <SaveMetricToDashboardButton metricIds={[metricId]} selectedDashboards={dashboardIds || []} />
  );
});
SaveToDashboardButton.displayName = 'SaveToDashboardButton';

const ClosePageButton = React.memo(({ metricId }: { metricId: string }) => {
  return <SelectableButton selected={false} tooltipText="Close" icon={<Xmark />} />;
});
ClosePageButton.displayName = 'ClosePageButton';
