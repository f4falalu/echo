import {
  type ChartType,
  type ColumnLabelFormat,
  DEFAULT_COLUMN_LABEL_FORMAT,
} from '@buster/server-shared/metrics';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useDatasetOptions } from './useDatasetOptions';

describe('useDatasetOptions', () => {
  const mockData = [
    { month: 'Jan', sales: 100, profit: 50 },
    { month: 'Feb', sales: 200, profit: 100 },
    { month: 'Mar', sales: 300, profit: 150 },
  ];

  const mockColumnLabelFormats: Record<string, ColumnLabelFormat> = {
    sales: { ...DEFAULT_COLUMN_LABEL_FORMAT, columnType: 'number', style: 'number' },
    profit: { ...DEFAULT_COLUMN_LABEL_FORMAT, columnType: 'number', style: 'number' },
    month: { ...DEFAULT_COLUMN_LABEL_FORMAT, columnType: 'text', style: 'string' },
    level: { ...DEFAULT_COLUMN_LABEL_FORMAT, columnType: 'text', style: 'string' },
  };
  it('should return the correct axis keys for bar chart', () => {
    const { result } = renderHook(() =>
      useDatasetOptions({
        data: mockData,
        selectedAxis: {
          x: ['month'],
          y: ['sales'],
          tooltip: ['profit'],
        },
        selectedChartType: 'bar' as ChartType,
        columnLabelFormats: mockColumnLabelFormats,
        pieMinimumSlicePercentage: 5,
        columnMetadata: [],
        barGroupType: undefined,
        lineGroupType: null,
        trendlines: undefined,
        barSortBy: undefined,
        pieSortBy: undefined,
        groupByMethod: undefined,
        colors: [],
      } as unknown as any)
    );

    expect(result.current.yAxisKeys).toEqual(['sales']);
    expect(result.current.tooltipKeys).toEqual(['profit']);
    expect(result.current.hasMismatchedTooltipsAndMeasures).toBe(true);
    expect(result.current.isDownsampled).toBe(false);
  });
  it('should handle empty data correctly', () => {
    const { result } = renderHook(() =>
      useDatasetOptions({
        data: [],
        selectedAxis: {
          x: ['month'],
          y: ['sales', 'profit'],
          tooltip: [],
        },
        selectedChartType: 'line' as ChartType,
        columnLabelFormats: mockColumnLabelFormats,
        pieMinimumSlicePercentage: 5,
        columnMetadata: [],
        barGroupType: undefined,
        lineGroupType: null,
        trendlines: undefined,
        barSortBy: undefined,
        pieSortBy: undefined,
        groupByMethod: undefined,
        colors: [],
      } as unknown as any)
    );

    expect(result.current.datasetOptions.datasets).toHaveLength(2); // One for each y-axis field
    expect(result.current.datasetOptions.ticks).toEqual(expect.any(Array));
    expect(result.current.yAxisKeys).toEqual(['sales', 'profit']);
    expect(result.current.hasMismatchedTooltipsAndMeasures).toBe(false);
  });

  it('should apply colors when colorBy is present', () => {
    const mockDataWithCategories = [
      { month: 'Jan', sales: 100, level: 'Level 1' },
      { month: 'Feb', sales: 200, level: 'Level 2' },
      { month: 'Mar', sales: 300, level: 'Level 1' },
    ];

    const { result } = renderHook(() =>
      useDatasetOptions({
        data: mockDataWithCategories,
        selectedAxis: {
          x: ['month'],
          y: ['sales'],
          tooltip: ['level'], // Include the level field in tooltip so it's available for coloring
          colorBy: { columnId: 'level' },
        },
        selectedChartType: 'bar' as ChartType,
        columnLabelFormats: mockColumnLabelFormats,
        pieMinimumSlicePercentage: 5,
        columnMetadata: [],
        barGroupType: undefined,
        lineGroupType: null,
        trendlines: undefined,
        barSortBy: undefined,
        pieSortBy: undefined,
        groupByMethod: undefined,
        colors: ['#FF0000', '#00FF00', '#0000FF'],
      } as unknown as any)
    );

    const datasets = result.current.datasetOptions.datasets;
    expect(datasets).toHaveLength(1);

    const dataset = datasets[0];
    expect(dataset?.colors).toBeDefined();
    expect(dataset?.colors).toHaveLength(3); // One color for each data point

    // Level 1 items (Jan, Mar) should have the same color, Level 2 (Feb) should have different color
    expect(dataset?.colors?.[0]).toEqual(dataset?.colors?.[2]); // Jan and Mar should be same color
    expect(dataset?.colors?.[1]).not.toEqual(dataset?.colors?.[0]); // Feb should be different color
  });

  it('should not apply colors when colorBy is null', () => {
    const { result } = renderHook(() =>
      useDatasetOptions({
        data: mockData,
        selectedAxis: {
          x: ['month'],
          y: ['sales'],
          tooltip: null,
          colorBy: null,
        },
        selectedChartType: 'bar' as ChartType,
        columnLabelFormats: mockColumnLabelFormats,
        pieMinimumSlicePercentage: 5,
        columnMetadata: [],
        barGroupType: undefined,
        lineGroupType: null,
        trendlines: undefined,
        barSortBy: undefined,
        pieSortBy: undefined,
        groupByMethod: undefined,
        colors: ['#FF0000', '#00FF00', '#0000FF'],
      } as unknown as any)
    );

    const datasets = result.current.datasetOptions.datasets;
    expect(datasets).toHaveLength(1);

    const dataset = datasets[0];
    expect(dataset?.colors).toBeUndefined();
  });
});
