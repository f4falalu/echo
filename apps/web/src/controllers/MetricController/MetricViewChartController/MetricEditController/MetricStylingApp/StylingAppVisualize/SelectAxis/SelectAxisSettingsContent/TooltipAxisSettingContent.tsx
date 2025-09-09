import React from 'react';
import { useUpdateMetricChart } from '@/context/Metrics/useUpdateMetricChart';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { useAxisContextDisableTooltip, useAxisContextMetricId } from '../useSelectAxisContext';
import { EditShowTooltip } from './EditShowTooltip';

export const TooltipAxisSettingContent: React.FC = React.memo(() => {
  const disableTooltip = useAxisContextDisableTooltip();
  const metricId = useAxisContextMetricId();
  const { onUpdateMetricChartConfig } = useUpdateMetricChart({ metricId });

  const onChangeDisableTooltip = useMemoizedFn((value: boolean) => {
    onUpdateMetricChartConfig({
      chartConfig: {
        disableTooltip: value,
      },
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
