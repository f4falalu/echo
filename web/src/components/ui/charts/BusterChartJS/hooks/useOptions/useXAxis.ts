import {
  BusterChartConfigProps,
  ChartEncodes,
  ChartType,
  BusterChartProps,
  IColumnLabelFormat,
  ComboChartAxis,
  XAxisConfig
} from '@/api/asset_interfaces/metric/charts';
import { useMemoizedFn } from '@/hooks';
import { useMemo } from 'react';
import { DeepPartial } from 'utility-types';
import type { ScaleChartOptions, Scale, GridLineOptions } from 'chart.js';
import { useXAxisTitle } from '../../../commonHelpers/useXAxisTitle';
import { useIsStacked } from './useIsStacked';
import { formatLabel, isNumericColumnType, truncateText } from '@/lib';
import isDate from 'lodash/isDate';
import { Chart as ChartJS } from 'chart.js';
import { DEFAULT_COLUMN_LABEL_FORMAT } from '@/api/asset_interfaces/metric';

const DEFAULT_X_AXIS_TICK_CALLBACK = ChartJS.defaults.scales.category.ticks.callback;

export const useXAxis = ({
  columnLabelFormats,
  selectedAxis,
  selectedChartType,
  columnSettings,
  xAxisLabelRotation,
  xAxisShowAxisLabel,
  xAxisAxisTitle,
  xAxisShowAxisTitle,
  gridLines,
  lineGroupType,
  barGroupType,
  xAxisTimeInterval
}: {
  columnLabelFormats: NonNullable<BusterChartConfigProps['columnLabelFormats']>;
  selectedAxis: ChartEncodes;
  selectedChartType: ChartType;
  xAxisLabelRotation: NonNullable<BusterChartProps['xAxisLabelRotation']>;
  xAxisShowAxisLabel: NonNullable<BusterChartProps['xAxisShowAxisLabel']>;
  gridLines: NonNullable<BusterChartProps['gridLines']>;
  xAxisShowAxisTitle: BusterChartProps['xAxisShowAxisTitle'];
  xAxisAxisTitle: BusterChartProps['xAxisAxisTitle'];
  lineGroupType: BusterChartProps['lineGroupType'];
  barGroupType: BusterChartProps['barGroupType'];
  columnSettings: BusterChartProps['columnSettings'];
  xAxisTimeInterval: BusterChartProps['xAxisTimeInterval'];
}): DeepPartial<ScaleChartOptions<'bar'>['scales']['x']> | undefined => {
  const isScatterChart = selectedChartType === ChartType.Scatter;
  const isPieChart = selectedChartType === ChartType.Pie;
  const isLineChart = selectedChartType === ChartType.Line;
  const isComboChart = selectedChartType === ChartType.Combo;
  const useGrid = isScatterChart;

  const isSupportedType = useMemo(() => {
    return !isPieChart;
  }, [isPieChart]);

  const xAxisColumnFormats: Record<string, IColumnLabelFormat> = useMemo(() => {
    if (!isSupportedType) return {};

    return selectedAxis.x.reduce<Record<string, IColumnLabelFormat>>((acc, x) => {
      acc[x] = columnLabelFormats[x] || DEFAULT_COLUMN_LABEL_FORMAT;
      return acc;
    }, {});
  }, [selectedAxis.x, columnLabelFormats, isSupportedType]);

  const stacked = useIsStacked({ selectedChartType, lineGroupType, barGroupType });

  const grid: DeepPartial<GridLineOptions> | undefined = useMemo(() => {
    return {
      display: useGrid && gridLines,
      offset: true
    } satisfies DeepPartial<GridLineOptions>;
  }, [gridLines, useGrid]);

  const type: DeepPartial<ScaleChartOptions<'bar'>['scales']['x']['type']> = useMemo(() => {
    const xAxisKeys = Object.keys(xAxisColumnFormats);
    const xAxisKeysLength = xAxisKeys.length;
    const firstXKey = xAxisKeys[0];

    if (xAxisKeysLength === 1) {
      const xIsDate = xAxisColumnFormats[firstXKey].columnType === 'date';

      if ((isLineChart || isScatterChart) && xIsDate) {
        return 'time';
      }

      if (isComboChart && columnSettings) {
        const allYAxisKeys = [...selectedAxis.y, ...((selectedAxis as ComboChartAxis).y2 || [])];
        const atLeastOneLineVisualization = allYAxisKeys.some(
          (y) =>
            columnSettings[y]?.columnVisualization === 'line' ||
            columnSettings[y]?.columnVisualization === 'dot'
        );

        if (atLeastOneLineVisualization) return 'time';
      }
    }

    if (isScatterChart && xAxisKeysLength === 1) {
      const isNumeric = isNumericColumnType(xAxisColumnFormats[firstXKey]?.columnType);
      if (isNumeric) return 'linear';
    }

    return 'category';
  }, [isScatterChart, isComboChart, isLineChart, columnSettings, xAxisColumnFormats]);

  const title = useXAxisTitle({
    xAxis: selectedAxis.x,
    columnLabelFormats,
    xAxisAxisTitle,
    xAxisShowAxisTitle,
    selectedAxis,
    isSupportedChartForAxisTitles: isSupportedType
  });

  const customTickCallback = useMemoizedFn(function (
    this: Scale,
    value: string | number,
    index: number
  ) {
    const rawValue = this.getLabelForValue(value as number);

    if (type === 'time' || isDate(rawValue)) {
      const xKey = selectedAxis.x[0];
      const xColumnLabelFormat = xAxisColumnFormats[xKey];
      const res = formatLabel(rawValue, xColumnLabelFormat);
      return truncateText(res, 20);
    }

    return DEFAULT_X_AXIS_TICK_CALLBACK.call(this, value, index, this.getLabels() as any);
  });

  const tickCallback = useMemo(() => {
    if (type === 'time') {
      const isSingleXAxis = selectedAxis.x.length === 1;
      const columnLabelFormat = xAxisColumnFormats[selectedAxis.x[0]];
      const isDate = columnLabelFormat?.columnType === 'date';
      const isAutoDate = columnLabelFormat?.dateFormat === 'auto' || !columnLabelFormat?.dateFormat;
      const useAutoDate = isSingleXAxis && isDate && isAutoDate;
      if (useAutoDate) return null;
    }
    return customTickCallback;
  }, [customTickCallback, type, selectedAxis.x, xAxisColumnFormats]);

  const rotation = useMemo(() => {
    if (xAxisLabelRotation === 'auto' || xAxisLabelRotation === undefined) return undefined;
    return {
      maxRotation: xAxisLabelRotation,
      minRotation: xAxisLabelRotation
    } satisfies DeepPartial<ScaleChartOptions<'bar'>['scales']['x']['ticks']>;
  }, [xAxisLabelRotation]);

  const timeUnit = useMemo(() => {
    if (type === 'time' && xAxisTimeInterval) {
      const arrayOfValidTimeUnits: XAxisConfig['xAxisTimeInterval'][] = [
        'day',
        'week',
        'month',
        'quarter',
        'year'
      ];
      const isValidTimeUnit = arrayOfValidTimeUnits.includes(xAxisTimeInterval);
      return isValidTimeUnit ? xAxisTimeInterval : false;
    }
    return false;
  }, [type, xAxisTimeInterval]);

  const offset = useMemo(() => {
    if (isScatterChart) return false;
    if (isLineChart) return lineGroupType !== 'percentage-stack';
    return true;
  }, [isScatterChart, isLineChart, lineGroupType]);

  const memoizedXAxisOptions: DeepPartial<ScaleChartOptions<'bar'>['scales']['x']> | undefined =
    useMemo(() => {
      if (isPieChart) return undefined;
      return {
        type,
        offset,
        title: {
          display: !!title,
          text: title
        },
        stacked,
        time: {
          unit: xAxisTimeInterval ? xAxisTimeInterval : false
        },
        ticks: {
          ...rotation,
          sampleSize: type === 'time' ? 24 : undefined,
          display: xAxisShowAxisLabel,
          callback: tickCallback as any, //I need to use null for auto date
          //@ts-ignore
          time: {
            unit: timeUnit
          }
        },
        grid
      } satisfies DeepPartial<ScaleChartOptions<'bar'>['scales']['x']>;
    }, [
      timeUnit,
      offset,
      title,
      isScatterChart,
      isPieChart,
      tickCallback,
      xAxisShowAxisLabel,
      stacked,
      type,
      grid,
      timeUnit,
      rotation,
      tickCallback
    ]);

  return memoizedXAxisOptions;
};
