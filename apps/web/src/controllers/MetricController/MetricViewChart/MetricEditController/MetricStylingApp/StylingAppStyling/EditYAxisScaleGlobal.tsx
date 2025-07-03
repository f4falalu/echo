import React, { useMemo } from 'react';
import type { BusterMetricChartConfig } from '@/api/asset_interfaces';
import { useMemoizedFn } from '@/hooks';
import { EditAxisScale } from '../StylingAppVisualize/SelectAxis/SelectAxisSettingsContent/EditAxisScale';

export const EditYAxisScaleGlobal: React.FC<{
  yAxisScaleType: BusterMetricChartConfig['yAxisScaleType'];
  y2AxisScaleType: BusterMetricChartConfig['y2AxisScaleType'];
  onUpdateChartConfig: (config: Partial<BusterMetricChartConfig>) => void;
}> = React.memo(({ yAxisScaleType, y2AxisScaleType, onUpdateChartConfig }) => {
  const mostPermissiveScale = useMemo(() => {
    return yAxisScaleType === y2AxisScaleType ? yAxisScaleType : 'linear';
  }, [yAxisScaleType, y2AxisScaleType]);

  const onChangeAxisScale = useMemoizedFn((value: BusterMetricChartConfig['yAxisScaleType']) => {
    onUpdateChartConfig({
      yAxisScaleType: value,
      y2AxisScaleType: value
    });
  });

  return <EditAxisScale scaleType={mostPermissiveScale} onChangeAxisScale={onChangeAxisScale} />;
});
EditYAxisScaleGlobal.displayName = 'EditYAxisScaleGlobal';
