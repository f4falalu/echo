import type { ChartConfigProps, ColumnLabelFormat } from '@buster/server-shared/metrics';
import React, { useMemo } from 'react';
import { useUpdateMetricChart } from '@/context/Metrics/useUpdateMetricChart';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { AXIS_TITLE_SEPARATOR } from '@/lib/axisFormatter';
import { formatLabel } from '@/lib/columnFormatter';
import {
  useAxisContextColumnLabelFormats,
  useAxisContextMetricId,
  useAxisContextSelectedAxis,
  useAxisContextYAxisAxisTitle,
  useAxisContextYAxisScaleType,
  useAxisContextYAxisShowAxisLabel,
  useAxisContextYAxisShowAxisTitle,
} from '../useSelectAxisContext';
import { EditAxisScale } from './EditAxisScale';
import { EditShowAxisLabel } from './EditShowAxisLabel';
import { EditShowAxisTitle } from './EditShowAxisTitle';

export const YAxisSettingContent: React.FC = React.memo(() => {
  const metricId = useAxisContextMetricId();
  const { onUpdateMetricChartConfig } = useUpdateMetricChart({ metricId });
  const yAxisAxisTitle = useAxisContextYAxisAxisTitle();
  const selectedAxis = useAxisContextSelectedAxis();
  const columnLabelFormats = useAxisContextColumnLabelFormats();
  const yAxisShowAxisLabel = useAxisContextYAxisShowAxisLabel();
  const yAxisScaleType = useAxisContextYAxisScaleType();
  const yAxisShowAxisTitle = useAxisContextYAxisShowAxisTitle();

  const yAxis: string[] = useMemo(() => {
    return selectedAxis?.y || [];
  }, [selectedAxis]);

  const assosciatedColumnLabelFormats: ColumnLabelFormat[] = useMemo(() => {
    return yAxis.map((x) => columnLabelFormats[x]) || [];
  }, [columnLabelFormats, yAxis]);

  const formattedColumnTitle: string = useMemo(() => {
    return yAxis
      .map((columnId) => {
        return formatLabel(columnId, columnLabelFormats[columnId], true);
      })
      .join(AXIS_TITLE_SEPARATOR);
  }, [yAxisAxisTitle, yAxis, assosciatedColumnLabelFormats]);

  const onChangeAxisTitle = useMemoizedFn((value: string | null) => {
    onUpdateMetricChartConfig({
      chartConfig: {
        yAxisAxisTitle: value,
      },
    });
  });

  const onChangeShowAxisLabel = useMemoizedFn((value: boolean) => {
    onUpdateMetricChartConfig({
      chartConfig: {
        yAxisShowAxisLabel: value,
      },
    });
  });

  const onChangeAxisScale = useMemoizedFn((yAxisScaleType: ChartConfigProps['yAxisScaleType']) => {
    onUpdateMetricChartConfig({
      chartConfig: {
        yAxisScaleType,
      },
    });
  });

  const onChangeShowAxisTitle = useMemoizedFn((value: boolean) => {
    onUpdateMetricChartConfig({
      chartConfig: {
        yAxisShowAxisTitle: value,
      },
    });
  });

  return (
    <>
      <EditShowAxisTitle
        axisTitle={yAxisAxisTitle}
        formattedColumnTitle={formattedColumnTitle}
        onChangeAxisTitle={onChangeAxisTitle}
        showAxisTitle={yAxisShowAxisTitle}
        onChangeShowAxisTitle={onChangeShowAxisTitle}
      />

      <EditShowAxisLabel
        showAxisLabel={yAxisShowAxisLabel}
        onChangeShowAxisLabel={onChangeShowAxisLabel}
      />

      <EditAxisScale scaleType={yAxisScaleType} onChangeAxisScale={onChangeAxisScale} />
    </>
  );
});
YAxisSettingContent.displayName = 'YAxisSettingContent';
