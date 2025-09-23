import {
  type ChartConfigProps,
  type ChartEncodes,
  type ChartType,
  type ColumnLabelFormat,
  type ComboChartAxis,
  DEFAULT_COLUMN_LABEL_FORMAT,
  DEFAULT_COLUMN_SETTINGS,
} from '@buster/server-shared/metrics';
import type { GridLineOptions, Scale, ScaleChartOptions } from 'chart.js';
import { useMemo } from 'react';
import type { DeepPartial } from 'utility-types';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import type { BusterChartProps } from '../../../BusterChart.types';
import { formatYAxisLabel, yAxisSimilar } from '../../../commonHelpers';
import { useYAxisTitle } from './axisHooks/useYAxisTitle';
import { useIsStacked } from './useIsStacked';
import { DEFAULT_Y2_AXIS_COUNT } from './useY2Axis';

export const useYAxis = ({
  columnLabelFormats,
  selectedAxis,
  selectedChartType,
  barGroupType,
  lineGroupType,
  yAxisAxisTitle,
  yAxisShowAxisTitle,
  yAxisShowAxisLabel,
  yAxisStartAxisAtZero,
  yAxisScaleType,
  gridLines,
  columnMetadata,
  columnSettings,
}: {
  columnLabelFormats: NonNullable<ChartConfigProps['columnLabelFormats']>;
  selectedAxis: ChartEncodes;
  selectedChartType: ChartType;
  columnMetadata: NonNullable<BusterChartProps['columnMetadata']> | undefined;
  barGroupType: BusterChartProps['barGroupType'];
  lineGroupType: BusterChartProps['lineGroupType'];
  yAxisAxisTitle: BusterChartProps['yAxisAxisTitle'];
  yAxisShowAxisTitle: BusterChartProps['yAxisShowAxisTitle'];
  yAxisShowAxisLabel: BusterChartProps['yAxisShowAxisLabel'];
  yAxisStartAxisAtZero: BusterChartProps['yAxisStartAxisAtZero'];
  yAxisScaleType: BusterChartProps['yAxisScaleType'];
  columnSettings: NonNullable<BusterChartProps['columnSettings']>;
  gridLines: BusterChartProps['gridLines'];
}): DeepPartial<ScaleChartOptions<'bar'>['scales']['y']> | undefined => {
  const yAxisKeys = selectedAxis.y;
  const y2AxisKeys = (selectedAxis as ComboChartAxis)?.y2 || [];
  const hasY2Axis = y2AxisKeys.length > 0;

  const useMinValue = useMemo(() => {
    if (!hasY2Axis) return false;
    if (selectedChartType !== 'combo') return false;
    if (!columnMetadata) return false;

    const checkVales = [...yAxisKeys, ...y2AxisKeys];

    // Create lookup map for O(1) column access
    const columnMap = new Map(columnMetadata.map((col) => [col.name, col]));

    let allBarValues = true;
    let hasNegativeValues = false;

    // Single pass to check both conditions
    for (const key of checkVales) {
      const column = columnMap.get(key);
      if (!column) {
        allBarValues = false;
        continue;
      }

      // Check if this column is a bar
      const visualization =
        columnSettings[column.name]?.columnVisualization ||
        DEFAULT_COLUMN_SETTINGS.columnVisualization;
      if (visualization !== 'bar') {
        allBarValues = false;
      }

      // Check if this column has negative values
      if (Number(column.min_value ?? 0) < 0) {
        hasNegativeValues = true;
      }
    }

    if (allBarValues) return true;
    if (hasNegativeValues) return false;

    return false;
  }, [hasY2Axis, yAxisKeys, y2AxisKeys, selectedChartType, columnMetadata, columnSettings]);

  const isSupportedType = useMemo(() => {
    return selectedChartType !== 'pie';
  }, [selectedChartType]);

  const grid: DeepPartial<GridLineOptions> | undefined = useMemo(() => {
    return {
      display: gridLines,
    } satisfies DeepPartial<GridLineOptions>;
  }, [gridLines]);

  const usePercentageModeAxis = useMemo(() => {
    if (!isSupportedType) return false;
    if (selectedChartType === 'bar') return barGroupType === 'percentage-stack';
    if (selectedChartType === 'line') return lineGroupType === 'percentage-stack';
    return false;
  }, [lineGroupType, selectedChartType, barGroupType, isSupportedType]);

  const yAxisColumnFormats: Record<string, ColumnLabelFormat> = useMemo(() => {
    if (!isSupportedType) return {};

    return selectedAxis.y.reduce<Record<string, ColumnLabelFormat>>((acc, y) => {
      acc[y] = columnLabelFormats[y] || DEFAULT_COLUMN_LABEL_FORMAT;
      return acc;
    }, {});
  }, [selectedAxis.y, columnLabelFormats, isSupportedType]);

  const stacked = useIsStacked({ selectedChartType, lineGroupType, barGroupType });

  const canUseSameYFormatter = useMemo(() => {
    if (!isSupportedType) return false;

    const hasMultipleY = selectedAxis.y.length > 1;
    return hasMultipleY ? yAxisSimilar(selectedAxis.y, columnLabelFormats) : true;
  }, [selectedAxis.y, columnLabelFormats, isSupportedType]);

  const title = useYAxisTitle({
    yAxis: selectedAxis.y,
    columnLabelFormats,
    yAxisAxisTitle,
    yAxisShowAxisTitle,
    selectedAxis,
    isSupportedChartForAxisTitles: isSupportedType,
  });

  const tickCallback = useMemoizedFn(function (
    this: Scale,
    value: string | number,
    _index: number
  ) {
    return formatYAxisLabel(
      value,
      yAxisKeys,
      canUseSameYFormatter,
      yAxisColumnFormats,
      usePercentageModeAxis
    );
  });

  const type = useMemo(() => {
    if (!isSupportedType) return undefined;
    return yAxisScaleType === 'log' ? 'logarithmic' : 'linear';
  }, [yAxisScaleType, isSupportedType]);

  const memoizedYAxisOptions: DeepPartial<ScaleChartOptions<'bar'>['scales']['y']> | undefined =
    useMemo(() => {
      if (!isSupportedType) return undefined;

      const baseConfig = {
        type,
        grid,
        max: usePercentageModeAxis ? 100 : undefined,
        beginAtZero: yAxisStartAxisAtZero !== false,
        stacked,
        title: {
          display: !!title,
          text: title,
        },
        ticks: {
          display: yAxisShowAxisLabel,
          callback: tickCallback,
          count: useMinValue ? DEFAULT_Y2_AXIS_COUNT : undefined,
          includeBounds: true,
        },
        min: useMinValue ? 0 : undefined,
        border: {
          display: yAxisShowAxisLabel,
        },
      } as DeepPartial<ScaleChartOptions<'bar'>['scales']['y']>;

      return baseConfig;
    }, [
      tickCallback,
      type,
      title,
      stacked,
      grid,
      isSupportedType,
      yAxisStartAxisAtZero,
      yAxisShowAxisLabel,
      usePercentageModeAxis,
    ]);

  return memoizedYAxisOptions;
};
