import React from 'react';
import { FileContainerButtonsProps } from './interfaces';
import { Button, ButtonProps } from 'antd';
import { AppMaterialIcons, AppTooltip } from '@/components';
import { useChatLayoutContextSelector } from '../../ChatLayoutContext';
import { useMemoizedFn } from 'ahooks';
import { SaveMetricToCollectionButton } from '@appComponents/Buttons/SaveMetricToCollectionButton';
import { SaveMetricToDashboardButton } from '@appComponents/Buttons/SaveMetricToDashboardButton';
import { ShareMetricButton } from '@appComponents/Buttons/ShareMetricButton';
import { useChatContextSelector } from '../../ChatContext';

export const MetricContainerHeaderButtons: React.FC<FileContainerButtonsProps> = React.memo(() => {
  return (
    <div className="flex items-center gap-1">
      <EditChartButton />
      <SaveToCollectionButton />
      <SaveToDashboardButton />
      <ShareMetricButton />
    </div>
  );
});

MetricContainerHeaderButtons.displayName = 'MetricContainerHeaderButtons';

const EditChartButton = React.memo(() => {
  const selectedFileViewSecondary = useChatLayoutContextSelector(
    (x) => x.selectedFileViewSecondary
  );
  const onSetFileView = useChatLayoutContextSelector((x) => x.onSetFileView);
  const isSelectedView = selectedFileViewSecondary === 'chart-edit';
  const buttonVariant: ButtonProps['variant'] = isSelectedView ? 'filled' : 'text';
  const onClickButton = useMemoizedFn(() => {
    const secondaryView = isSelectedView ? null : 'chart-edit';
    onSetFileView({ secondaryView });
  });
  return (
    <AppTooltip title="Edit chart">
      <Button
        color="default"
        variant={buttonVariant}
        icon={<AppMaterialIcons icon="chart_edit" />}
        onClick={onClickButton}
      />
    </AppTooltip>
  );
});
EditChartButton.displayName = 'EditChartButton';

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
