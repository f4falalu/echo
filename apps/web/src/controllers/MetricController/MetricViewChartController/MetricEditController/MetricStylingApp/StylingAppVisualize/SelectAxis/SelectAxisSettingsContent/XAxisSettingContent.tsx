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
  useAxisContextXAxisAxisTitle,
  useAxisContextXAxisLabelRotation,
  useAxisContextXAxisShowAxisLabel,
  useAxisContextXAxisShowAxisTitle,
} from '../useSelectAxisContext';
import { EditAxisLabelRotation } from './EditAxisLabelRotation';
import { EditShowAxisLabel } from './EditShowAxisLabel';
import { EditShowAxisTitle } from './EditShowAxisTitle';

export const XAxisSettingContent: React.FC = React.memo(() => {
  const metricId = useAxisContextMetricId();
  const { onUpdateMetricChartConfig } = useUpdateMetricChart({ metricId });
  const xAxisAxisTitle = useAxisContextXAxisAxisTitle();
  const columnLabelFormats = useAxisContextColumnLabelFormats();
  const xAxisShowAxisLabel = useAxisContextXAxisShowAxisLabel();
  const xAxisLabelRotation = useAxisContextXAxisLabelRotation();
  const xAxisShowAxisTitle = useAxisContextXAxisShowAxisTitle();
  const selectedAxis = useAxisContextSelectedAxis();

  const xAxis: string[] = useMemo(() => {
    return selectedAxis?.x || [];
  }, [selectedAxis]);

  const assosciatedColumnLabelFormats: ColumnLabelFormat[] = useMemo(() => {
    return xAxis.map((x) => columnLabelFormats[x]) || [];
  }, [columnLabelFormats, xAxis]);

  const formattedColumnTitle: string = useMemo(() => {
    return xAxis
      .map((columnId) => {
        return formatLabel(columnId, columnLabelFormats[columnId], true);
      })
      .join(AXIS_TITLE_SEPARATOR);
  }, [xAxisAxisTitle, xAxis, assosciatedColumnLabelFormats]);

  const onChangeAxisTitle = useMemoizedFn((value: string | null) => {
    onUpdateMetricChartConfig({
      chartConfig: {
        xAxisAxisTitle: value,
      },
    });
  });

  const onChangeShowAxisTitle = useMemoizedFn((value: boolean) => {
    onUpdateMetricChartConfig({
      chartConfig: {
        xAxisShowAxisTitle: value,
      },
    });
  });

  const onChangeShowAxisLabel = useMemoizedFn((value: boolean) => {
    onUpdateMetricChartConfig({
      chartConfig: {
        xAxisShowAxisLabel: value,
      },
    });
  });

  const onChangeLabelRotation = useMemoizedFn(
    (xAxisLabelRotation: ChartConfigProps['xAxisLabelRotation']) => {
      onUpdateMetricChartConfig({
        chartConfig: {
          xAxisLabelRotation,
        },
      });
    }
  );

  return (
    <>
      <EditShowAxisTitle
        axisTitle={xAxisAxisTitle}
        showAxisTitle={xAxisShowAxisTitle}
        formattedColumnTitle={formattedColumnTitle}
        onChangeAxisTitle={onChangeAxisTitle}
        onChangeShowAxisTitle={onChangeShowAxisTitle}
      />

      <EditShowAxisLabel
        showAxisLabel={xAxisShowAxisLabel}
        onChangeShowAxisLabel={onChangeShowAxisLabel}
      />

      <EditAxisLabelRotation
        xAxisLabelRotation={xAxisLabelRotation}
        onChangeLabelRotation={onChangeLabelRotation}
      />
    </>
  );
});
XAxisSettingContent.displayName = 'XAxisSettingContent';
