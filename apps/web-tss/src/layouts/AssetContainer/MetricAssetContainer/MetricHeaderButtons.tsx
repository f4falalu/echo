import { Link } from '@tanstack/react-router';
import React from 'react';
import { useGetMetric } from '@/api/buster_rest/metrics';
import { CreateChatButton } from '@/components/features/AssetLayout/CreateChatButton';
import { SaveMetricToCollectionButton } from '@/components/features/buttons/SaveMetricToCollectionButton';
import { SaveMetricToDashboardButton } from '@/components/features/buttons/SaveMetricToDashboardButton';
import { ShareMetricButton } from '@/components/features/buttons/ShareMetricButton';
import { ThreeDotMenuButton } from '@/components/features/metrics/MetricThreeDotMenu';
import { SquareChartPen } from '@/components/ui/icons';
import { useIsFileMode } from '@/context/Chats/useMode';
import { useIsMetricReadOnly } from '@/context/Metrics/useIsMetricReadOnly';
import { canEdit, getIsEffectiveOwner } from '@/lib/share';
import { FileButtonContainer } from '../FileButtonContainer';
import { HideButtonContainer } from '../HideButtonContainer';
import { SelectableButton } from '../SelectableButton';

export const MetricContainerHeaderButtons: React.FC<{
  metricId: string;
  metricVersionNumber: number;
}> = React.memo(({ metricId, metricVersionNumber }) => {
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
      {isEditor && !isViewingOldVersion && <EditChartButton metricId={metricId} />}
      <SaveToCollectionButton metricId={metricId} />
      <SaveToDashboardButton metricId={metricId} />
      {isEffectiveOwner && !isViewingOldVersion && <ShareMetricButton metricId={metricId} />}
      <ThreeDotMenuButton
        metricId={metricId}
        isViewingOldVersion={isViewingOldVersion}
        versionNumber={metricVersionNumber}
      />
      <HideButtonContainer show={isFileMode}>
        <CreateChatButton assetId={metricId} assetType="metric" />
      </HideButtonContainer>
    </FileButtonContainer>
  );
});

MetricContainerHeaderButtons.displayName = 'MetricContainerHeaderButtons';

const EditChartButton = React.memo(({ metricId }: { metricId: string }) => {
  const isEditorOpen = true;
  //  const metricVersionNumber = useChatLayoutContextSelector((x) => x.metricVersionNumber);
  // const editableSecondaryView: MetricFileViewSecondary = 'chart-edit';
  // const isSelectedView = selectedFileViewSecondary === editableSecondaryView;

  // const href = useMemo(() => {
  //   if (isSelectedView) {
  //     return assetParamsToRoute({
  //       chatId,
  //       assetId: metricId,
  //       type: 'metric',
  //       secondaryView: undefined,
  //       versionNumber: metricVersionNumber,
  //       page: 'chart',
  //     });
  //   }

  //   return assetParamsToRoute({
  //     chatId,
  //     assetId: metricId,
  //     type: 'metric',
  //     secondaryView: 'chart-edit',
  //     versionNumber: metricVersionNumber,
  //     page: 'chart',
  //   });
  // }, [chatId, metricId, isSelectedView, metricVersionNumber]);

  return (
    <Link
      to="/app/metrics/$metricId/chart"
      params={{
        metricId,
      }}
      data-testid="edit-chart-button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <SelectableButton
        tooltipText="Edit chart"
        icon={<SquareChartPen />}
        selected={isEditorOpen}
      />
    </Link>
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
