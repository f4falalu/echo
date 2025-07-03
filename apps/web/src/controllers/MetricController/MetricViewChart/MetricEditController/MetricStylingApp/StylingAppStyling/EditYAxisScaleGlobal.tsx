import React, { useMemo } from 'react';
import type { ChartConfigProps } from '@buster/server-shared/metrics';
import { useMemoizedFn } from '@/hooks';
import { EditAxisScale } from '../StylingAppVisualize/SelectAxis/SelectAxisSettingsContent/EditAxisScale';

export const EditYAxisScaleGlobal: React.FC<{
  yAxisScaleType: ChartConfigProps['yAxisScaleType'];
  y2AxisScaleType: ChartConfigProps['y2AxisScaleType'];
  onUpdateChartConfig: (config: Partial<ChartConfigProps>) => void;
}> = React.memo(({ yAxisScaleType, y2AxisScaleType, onUpdateChartConfig }) => {
  const mostPermissiveScale = useMemo(() => {
    return yAxisScaleType === y2AxisScaleType ? yAxisScaleType : 'linear';
  }, [yAxisScaleType, y2AxisScaleType]);

  const onChangeAxisScale = useMemoizedFn((value: ChartConfigProps['yAxisScaleType']) => {
    onUpdateChartConfig({
      yAxisScaleType: value,
      y2AxisScaleType: value
    });
  });

  return <EditAxisScale scaleType={mostPermissiveScale} onChangeAxisScale={onChangeAxisScale} />;
});
EditYAxisScaleGlobal.displayName = 'EditYAxisScaleGlobal';
