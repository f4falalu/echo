import React, { useMemo } from 'react';
import { FileContainerButtonsProps } from '../interfaces';
import { MetricFileViewSecondary, useChatLayoutContextSelector } from '../../../ChatLayoutContext';
import { useMemoizedFn } from '@/hooks';
import { useChatIndividualContextSelector } from '../../../ChatContext';
import { HideButtonContainer } from '../HideButtonContainer';
import { FileButtonContainer } from '../FileButtonContainer';
import { CreateChatButton } from '../CreateChatButtont';
import { SelectableButton } from '../SelectableButton';
import { SaveMetricToCollectionButton } from '../../../../../components/features/buttons/SaveMetricToCollectionButton';
import { SaveMetricToDashboardButton } from '../../../../../components/features/buttons/SaveMetricToDashboardButton';
import { ShareMetricButton } from '../../../../../components/features/buttons/ShareMetricButton';
import { SquareChartPen, SquareCode } from '@/components/ui/icons';
import { useGetMetric } from '@/api/buster_rest/metrics';
import { ThreeDotMenuButton } from './MetricThreeDotMenu';
import { canEdit, getIsEffectiveOwner } from '@/lib/share';
import Link from 'next/link';
import { BusterRoutes, createBusterRoute } from '@/routes';
import {
  assetParamsToRoute,
  createChatAssetRoute
} from '@/layouts/ChatLayout/ChatLayoutContext/helpers';

export const MetricContainerHeaderButtons: React.FC<FileContainerButtonsProps> = React.memo(() => {
  const selectedLayout = useChatLayoutContextSelector((x) => x.selectedLayout);
  const selectedFileId = useChatIndividualContextSelector((x) => x.selectedFileId)!;
  const metricId = selectedFileId;
  const { error: metricError, data: permission } = useGetMetric(
    { id: metricId },
    (x) => x.permission
  );

  //we assume it is fetched until it is not
  if (metricError) return null;

  const isEditor = canEdit(permission);
  const isEffectiveOwner = getIsEffectiveOwner(permission);

  return (
    <FileButtonContainer>
      {isEditor && <EditChartButton metricId={metricId} />}
      {isEffectiveOwner && <EditSQLButton metricId={metricId} />}
      <SaveToCollectionButton metricId={metricId} />
      <SaveToDashboardButton metricId={metricId} />
      {isEffectiveOwner && <ShareMetricButton metricId={metricId} />}
      <ThreeDotMenuButton metricId={metricId} />
      <HideButtonContainer show={selectedLayout === 'file'}>
        <CreateChatButton />
      </HideButtonContainer>
    </FileButtonContainer>
  );
});

MetricContainerHeaderButtons.displayName = 'MetricContainerHeaderButtons';

const EditChartButton = React.memo(({ metricId }: { metricId: string }) => {
  const selectedFileViewSecondary = useChatLayoutContextSelector(
    (x) => x.selectedFileViewSecondary
  );
  const chatId = useChatIndividualContextSelector((x) => x.chatId);
  const onSetFileView = useChatLayoutContextSelector((x) => x.onSetFileView);
  const editableSecondaryView: MetricFileViewSecondary = 'chart-edit';
  const isSelectedView = selectedFileViewSecondary === editableSecondaryView;

  const href = useMemo(() => {
    return assetParamsToRoute({
      chatId,
      assetId: metricId,
      type: 'metric',
      secondaryView: 'chart-edit'
    });
  }, [chatId, metricId]);

  const onClickButton = useMemoizedFn(() => {
    const secondaryView = isSelectedView ? null : editableSecondaryView;
    onSetFileView({ secondaryView, fileView: 'chart' });
  });

  return (
    <Link href={href}>
      <SelectableButton
        tooltipText="Edit chart"
        icon={<SquareChartPen />}
        onClick={onClickButton}
        selected={isSelectedView}
      />
    </Link>
  );
});
EditChartButton.displayName = 'EditChartButton';

const EditSQLButton = React.memo(({ metricId }: { metricId: string }) => {
  const selectedFileViewSecondary = useChatLayoutContextSelector(
    (x) => x.selectedFileViewSecondary
  );
  const onSetFileView = useChatLayoutContextSelector((x) => x.onSetFileView);
  const chatId = useChatIndividualContextSelector((x) => x.chatId);
  const editableSecondaryView: MetricFileViewSecondary = 'sql-edit';
  const isSelectedView = selectedFileViewSecondary === editableSecondaryView;

  const href = useMemo(() => {
    return assetParamsToRoute({
      chatId,
      assetId: metricId,
      type: 'metric',
      secondaryView: 'sql-edit'
    });
  }, [chatId, metricId]);

  const onClickButton = useMemoizedFn(() => {
    const secondaryView = isSelectedView ? null : editableSecondaryView;
    onSetFileView({ secondaryView, fileView: 'results' });
  });

  return (
    <Link href={href}>
      <SelectableButton
        tooltipText="SQL editor"
        icon={<SquareCode />}
        onClick={onClickButton}
        selected={isSelectedView}
      />
    </Link>
  );
});
EditSQLButton.displayName = 'EditSQLButton';

const SaveToCollectionButton = React.memo(({ metricId }: { metricId: string }) => {
  return <SaveMetricToCollectionButton metricIds={[metricId]} />;
});
SaveToCollectionButton.displayName = 'SaveToCollectionButton';

const SaveToDashboardButton = React.memo(({ metricId }: { metricId: string }) => {
  return <SaveMetricToDashboardButton metricIds={[metricId]} />;
});
SaveToDashboardButton.displayName = 'SaveToDashboardButton';

const ShareMetricButtonLocal = React.memo(({ metricId }: { metricId: string }) => {
  return <ShareMetricButton metricId={metricId} />;
});
ShareMetricButtonLocal.displayName = 'ShareMetricButtonLocal';
