import '../../../ChartJSTheme';

import { renderHook } from '@testing-library/react';
import { useXAxis } from './useXAxis';
import { ChartType } from '@/api/asset_interfaces/metric/charts';
import { DEFAULT_COLUMN_LABEL_FORMAT } from '@/api/asset_interfaces/metric';
import type { SimplifiedColumnType, ColumnSettings } from '@/api/asset_interfaces/metric';
import type { ChartEncodes } from '@/api/asset_interfaces/metric/charts';

describe('useXAxis', () => {
  const defaultProps = {
    columnLabelFormats: {
      date_column: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'date' as SimplifiedColumnType,
        style: 'date' as const
      },
      numeric_column: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number' as SimplifiedColumnType,
        style: 'number' as const
      },
      category_column: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'text' as SimplifiedColumnType,
        style: 'string' as const
      }
    },
    selectedAxis: {
      x: ['category_column'],
      y: ['numeric_column']
    } as ChartEncodes,
    selectedChartType: ChartType.Bar,
    xAxisLabelRotation: 'auto' as const,
    xAxisShowAxisLabel: true,
    gridLines: true,
    xAxisShowAxisTitle: true,
    xAxisAxisTitle: 'X Axis Title',
    lineGroupType: null,
    barGroupType: 'group' as const,
    columnSettings: {},
    xAxisTimeInterval: undefined
  };

  it('should return undefined for pie charts', () => {
    const props = {
      ...defaultProps,
      selectedChartType: ChartType.Pie
    };

    const { result } = renderHook(() => useXAxis(props));
    expect(result.current).toBeUndefined();
  });

  it('should set time scale for line charts with date x-axis', () => {
    const props = {
      ...defaultProps,
      selectedChartType: ChartType.Line,
      selectedAxis: {
        x: ['date_column'],
        y: ['numeric_column']
      } as ChartEncodes
    };

    const { result } = renderHook(() => useXAxis(props));
    expect(result.current?.type).toBe('time');
  });

  it('should set category scale for bar charts', () => {
    const { result } = renderHook(() => useXAxis(defaultProps));
    expect(result.current?.type).toBe('category');
  });

  it('should handle axis title display', () => {
    const { result } = renderHook(() => useXAxis(defaultProps));
    expect(result.current?.title?.display).toBe(true);
    expect(result.current?.title?.text).toBe('X Axis Title');

    const propsWithoutTitle = {
      ...defaultProps,
      xAxisShowAxisTitle: false
    };
    const { result: resultWithoutTitle } = renderHook(() => useXAxis(propsWithoutTitle));
    expect(resultWithoutTitle.current?.title?.display).toBe(false);
  });

  it('should handle grid display for scatter charts', () => {
    const scatterProps = {
      ...defaultProps,
      selectedChartType: ChartType.Scatter
    };

    const { result } = renderHook(() => useXAxis(scatterProps));
    expect(result.current?.grid?.display).toBe(true);

    const noGridProps = {
      ...scatterProps,
      gridLines: false
    };
    const { result: resultNoGrid } = renderHook(() => useXAxis(noGridProps));
    expect(resultNoGrid.current?.grid?.display).toBe(false);
  });

  it('should handle custom time intervals', () => {
    const timeIntervalProps = {
      ...defaultProps,
      selectedChartType: ChartType.Line,
      selectedAxis: {
        x: ['date_column'],
        y: ['numeric_column']
      } as ChartEncodes,
      xAxisTimeInterval: 'month' as const
    };

    const { result } = renderHook(() => useXAxis(timeIntervalProps));
    expect(result.current?.type).toBe('time');
    // @ts-ignore - Chart.js types don't properly expose the time unit property
    expect(result.current?.ticks?.time?.unit).toBe('month');
  });

  it('should handle label rotation', () => {
    const rotationProps = {
      ...defaultProps,
      xAxisLabelRotation: 45 as const
    };

    const { result } = renderHook(() => useXAxis(rotationProps));
    expect(result.current?.ticks?.maxRotation).toBe(45);
    expect(result.current?.ticks?.minRotation).toBe(45);
  });

  it('should handle axis label visibility', () => {
    const hiddenLabelsProps = {
      ...defaultProps,
      xAxisShowAxisLabel: false
    };

    const { result } = renderHook(() => useXAxis(hiddenLabelsProps));
    expect(result.current?.ticks?.display).toBe(false);
  });

  it('should handle stacked bar charts configuration', () => {
    const stackedBarProps = {
      ...defaultProps,
      barGroupType: 'stack' as const
    };

    const { result } = renderHook(() => useXAxis(stackedBarProps));
    expect(result.current?.stacked).toBe(true);
  });

  it('should handle multiple x-axis columns', () => {
    const multipleXAxisProps = {
      ...defaultProps,
      selectedAxis: {
        x: ['category_column', 'numeric_column'],
        y: ['numeric_column']
      } as ChartEncodes
    };

    const { result } = renderHook(() => useXAxis(multipleXAxisProps));
    expect(result.current?.type).toBe('category');
    expect(result.current?.ticks).toBeDefined();
  });

  it('should apply correct time scale settings for date columns', () => {
    const dateAxisProps = {
      ...defaultProps,
      selectedChartType: ChartType.Line,
      selectedAxis: {
        x: ['date_column'],
        y: ['numeric_column']
      } as ChartEncodes
    };

    const { result } = renderHook(() => useXAxis(dateAxisProps));
    expect(result.current?.type).toBe('time');
    expect(typeof result.current?.ticks).toBe('object');
  });

  it('should handle custom column settings', () => {
    const customColumnProps = {
      ...defaultProps,
      columnSettings: {
        category_column: {
          aggregation: 'sum',
          format: 'number',
          precision: 2
        } as ColumnSettings
      }
    };

    const { result } = renderHook(() => useXAxis(customColumnProps));
    expect(result.current?.ticks).toBeDefined();
  });

  it('should handle auto rotation settings correctly', () => {
    const autoRotationProps = {
      ...defaultProps,
      xAxisLabelRotation: 'auto' as const
    };

    const { result } = renderHook(() => useXAxis(autoRotationProps));
    expect(result.current?.ticks).toBeDefined();
    expect(result.current?.ticks?.autoSkip).toBe(true);
  });

  it('should configure scatter plot with numeric x-axis correctly', () => {
    const scatterProps = {
      ...defaultProps,
      selectedChartType: ChartType.Scatter,
      selectedAxis: {
        x: ['numeric_column'],
        y: ['numeric_column']
      } as ChartEncodes
    };

    const { result } = renderHook(() => useXAxis(scatterProps));
    expect(result.current?.type).toBe('linear');
    expect(result.current?.grid?.display).toBe(true);
  });

  it('should handle zero degree rotation explicitly', () => {
    const zeroRotationProps = {
      ...defaultProps,
      xAxisLabelRotation: 0 as const
    };

    const { result } = renderHook(() => useXAxis(zeroRotationProps));
    expect(result.current?.ticks?.maxRotation).toBe(0);
    expect(result.current?.ticks?.minRotation).toBe(0);
  });

  it('should handle line chart with grouped data', () => {
    const lineGroupProps = {
      ...defaultProps,
      selectedChartType: ChartType.Line,
      lineGroupType: 'stack' as const,
      selectedAxis: {
        x: ['date_column'],
        y: ['numeric_column']
      } as ChartEncodes
    };

    const { result } = renderHook(() => useXAxis(lineGroupProps));
    expect(result.current?.type).toBe('time');
    expect(result.current?.ticks).toBeDefined();
  });

  it('should handle disabled grid lines', () => {
    const noGridProps = {
      ...defaultProps,
      gridLines: false
    };

    const { result } = renderHook(() => useXAxis(noGridProps));
    expect(result.current?.grid?.display).toBeFalsy();
  });

  it('should handle custom time interval with quarter setting', () => {
    const quarterIntervalProps = {
      ...defaultProps,
      selectedChartType: ChartType.Line,
      selectedAxis: {
        x: ['date_column'],
        y: ['numeric_column']
      } as ChartEncodes,
      xAxisTimeInterval: 'quarter' as const
    };

    const { result } = renderHook(() => useXAxis(quarterIntervalProps));
    expect(result.current?.type).toBe('time');
    expect(result.current?.ticks).toBeDefined();
  });

  it('should handle bar chart with no axis title', () => {
    const noTitleProps = {
      ...defaultProps,
      xAxisShowAxisTitle: false,
      xAxisAxisTitle: undefined
    };

    const { result } = renderHook(() => useXAxis(noTitleProps));
    expect(result.current?.title?.display).toBe(false);
    expect(result.current?.title?.text).toBe('');
  });
});
