import type {
  ChartConfigProps,
  ColumnLabelFormat,
  ComboChartAxis,
} from '@buster/server-shared/metrics';
import React, { useMemo } from 'react';
import { useUpdateMetricChart } from '@/context/Metrics/useUpdateMetricChart';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { AXIS_TITLE_SEPARATOR } from '@/lib/axisFormatter';
import { formatLabel } from '@/lib/columnFormatter';
import {
  useAxisContextColumnLabelFormats,
  useAxisContextMetricId,
  useAxisContextSelectedAxis,
  useAxisContextY2AxisAxisTitle,
  useAxisContextY2AxisScaleType,
  useAxisContextY2AxisShowAxisLabel,
  useAxisContextY2AxisShowAxisTitle,
} from '../useSelectAxisContext';
import { EditAxisScale } from './EditAxisScale';
import { EditShowAxisLabel } from './EditShowAxisLabel';
import { EditShowAxisTitle } from './EditShowAxisTitle';

export const Y2AxisSettingContent: React.FC = React.memo(() => {
  const metricId = useAxisContextMetricId();
  const { onUpdateMetricChartConfig } = useUpdateMetricChart({ metricId });
  const selectedAxis = useAxisContextSelectedAxis() as ComboChartAxis;
  const columnLabelFormats = useAxisContextColumnLabelFormats();
  const y2AxisAxisTitle = useAxisContextY2AxisAxisTitle();
  const y2AxisShowAxisLabel = useAxisContextY2AxisShowAxisLabel();
  const y2AxisScaleType = useAxisContextY2AxisScaleType();
  const y2AxisShowAxisTitle = useAxisContextY2AxisShowAxisTitle();

  const y2Axis: string[] = useMemo(() => {
    return selectedAxis?.y2 || [];
  }, [selectedAxis]);

  const assosciatedColumnLabelForamts: ColumnLabelFormat[] = useMemo(() => {
    return y2Axis.map((x) => columnLabelFormats[x]) || [];
  }, [columnLabelFormats, y2Axis]);

  const formattedColumnTitle: string = useMemo(() => {
    return y2Axis
      .map((columnId) => {
        return formatLabel(columnId, columnLabelFormats[columnId], true);
      })
      .join(AXIS_TITLE_SEPARATOR);
  }, [y2AxisAxisTitle, y2Axis, assosciatedColumnLabelForamts]);

  const onChangeAxisTitle = useMemoizedFn((value: string | null) => {
    onUpdateMetricChartConfig({
      chartConfig: {
        y2AxisAxisTitle: value,
      },
    });
  });

  const onChangeShowAxisLabel = useMemoizedFn((value: boolean) => {
    onUpdateMetricChartConfig({
      chartConfig: {
        y2AxisShowAxisLabel: value,
      },
    });
  });

  const onChangeAxisScale = useMemoizedFn(
    (y2AxisScaleType: ChartConfigProps['y2AxisScaleType']) => {
      onUpdateMetricChartConfig({
        chartConfig: {
          y2AxisScaleType,
        },
      });
    }
  );

  const onChangeShowAxisTitle = useMemoizedFn((value: boolean) => {
    onUpdateMetricChartConfig({
      chartConfig: {
        y2AxisShowAxisTitle: value,
      },
    });
  });

  return (
    <>
      <EditShowAxisTitle
        axisTitle={y2AxisAxisTitle}
        formattedColumnTitle={formattedColumnTitle}
        onChangeAxisTitle={onChangeAxisTitle}
        onChangeShowAxisTitle={onChangeShowAxisTitle}
        showAxisTitle={y2AxisShowAxisTitle}
      />

      <EditShowAxisLabel
        showAxisLabel={y2AxisShowAxisLabel}
        onChangeShowAxisLabel={onChangeShowAxisLabel}
      />

      <EditAxisScale scaleType={y2AxisScaleType} onChangeAxisScale={onChangeAxisScale} />
    </>
  );
});
Y2AxisSettingContent.displayName = 'Y2AxisSettingContent';
