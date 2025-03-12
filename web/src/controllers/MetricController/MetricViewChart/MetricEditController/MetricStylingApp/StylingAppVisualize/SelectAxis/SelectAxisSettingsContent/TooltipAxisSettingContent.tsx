import React from 'react';
import { SelectAxisContainerId } from '../config';
import { useBusterMetricsContextSelector } from '@/context/Metrics';
import { EditShowTooltip } from './EditShowTooltip';
import { useSelectAxisContextSelector } from '../useSelectAxisContext';
import { useMemoizedFn } from '@/hooks';

export const TooltipAxisSettingContent: React.FC<{
  zoneId: SelectAxisContainerId;
}> = React.memo(({}) => {
  const disableTooltip = useSelectAxisContextSelector((x) => x.disableTooltip);

  const onUpdateMetricChartConfig = useBusterMetricsContextSelector(
    ({ onUpdateMetricChartConfig }) => onUpdateMetricChartConfig
  );

  const onChangeDisableTooltip = useMemoizedFn((value: boolean) => {
    onUpdateMetricChartConfig({
      chartConfig: {
        disableTooltip: value
      }
    });
  });

  return (
    <div>
      <EditShowTooltip
        disableTooltip={disableTooltip}
        onChangeDisableTooltip={onChangeDisableTooltip}
      />
    </div>
  );
});

TooltipAxisSettingContent.displayName = 'TooltipAxisSettingContent';
