import type { ChartConfigProps } from '@buster/server-shared/metrics';
import { describe, expect, it } from 'vitest';
import { validateAndAdjustBarLineAxes } from './bar-line-axis-validator';

describe('validateAndAdjustBarLineAxes', () => {
  it('should return unchanged config for non-bar/line charts', () => {
    const chartConfig = {
      selectedChartType: 'pie',
      columnLabelFormats: {},
    } as ChartConfigProps;

    const result = validateAndAdjustBarLineAxes(chartConfig);
    expect(result).toEqual(chartConfig);
  });

  it('should return valid when Y axis has numeric columns', () => {
    const chartConfig = {
      selectedChartType: 'line',
      columnLabelFormats: {
        month: {
          columnType: 'date',
        },
        sales: {
          columnType: 'number',
        },
      },
      barAndLineAxis: {
        x: ['month'],
        y: ['sales'],
      },
    } as any;

    const result = validateAndAdjustBarLineAxes(chartConfig);
    expect(result).toEqual(chartConfig);
  });

  it('should swap axes when Y has non-numeric and X has numeric columns', () => {
    const chartConfig = {
      selectedChartType: 'bar',
      columnLabelFormats: {
        revenue: {
          columnType: 'number',
        },
        sales_rep: {
          columnType: 'string',
        },
      },
      barAndLineAxis: {
        x: ['revenue'],
        y: ['sales_rep'],
      },
    } as any;

    const result = validateAndAdjustBarLineAxes(chartConfig);
    expect(result.barAndLineAxis?.x).toEqual(['sales_rep']);
    expect(result.barAndLineAxis?.y).toEqual(['revenue']);
  });

  it('should throw error when Y has non-numeric and X also has non-numeric columns', () => {
    const chartConfig = {
      selectedChartType: 'line',
      columnLabelFormats: {
        region: {
          columnType: 'string',
        },
        category: {
          columnType: 'string',
        },
      },
      barAndLineAxis: {
        x: ['region'],
        y: ['category'],
      },
    } as any;

    expect(() => validateAndAdjustBarLineAxes(chartConfig)).toThrowError(
      /Bar and line charts require numeric values on the Y axis.*category \(string\)/
    );
  });

  it('should handle multiple columns on axes', () => {
    const chartConfig = {
      selectedChartType: 'line',
      columnLabelFormats: {
        date: {
          columnType: 'date',
        },
        region: {
          columnType: 'string',
        },
        sales: {
          columnType: 'number',
        },
        profit: {
          columnType: 'number',
        },
      },
      barAndLineAxis: {
        x: ['date'],
        y: ['sales', 'profit'],
      },
    } as any;

    const result = validateAndAdjustBarLineAxes(chartConfig);
    expect(result).toEqual(chartConfig);
  });

  it('should throw error when Y has mixed numeric and non-numeric columns', () => {
    const chartConfig = {
      selectedChartType: 'bar',
      columnLabelFormats: {
        month: {
          columnType: 'date',
        },
        sales: {
          columnType: 'number',
        },
        category: {
          columnType: 'string',
        },
      },
      barAndLineAxis: {
        x: ['month'],
        y: ['sales', 'category'],
      },
    } as any;

    expect(() => validateAndAdjustBarLineAxes(chartConfig)).toThrowError(/category \(string\)/);
  });

  it('should handle date columns as non-numeric', () => {
    const chartConfig = {
      selectedChartType: 'line',
      columnLabelFormats: {
        sales: {
          columnType: 'number',
        },
        order_date: {
          columnType: 'date',
        },
      },
      barAndLineAxis: {
        x: ['sales'],
        y: ['order_date'],
      },
    } as any;

    const result = validateAndAdjustBarLineAxes(chartConfig);
    expect(result.barAndLineAxis?.x).toEqual(['order_date']);
    expect(result.barAndLineAxis?.y).toEqual(['sales']);
  });

  it('should handle missing barAndLineAxis gracefully', () => {
    const chartConfig = {
      selectedChartType: 'bar',
      columnLabelFormats: {},
    } as any;

    const result = validateAndAdjustBarLineAxes(chartConfig);
    expect(result).toEqual(chartConfig);
  });

  it('should throw error for empty axis arrays', () => {
    const chartConfig = {
      selectedChartType: 'line',
      columnLabelFormats: {},
      barAndLineAxis: {
        x: [],
        y: [],
      },
    } as any;

    expect(() => validateAndAdjustBarLineAxes(chartConfig)).toThrowError(
      /Bar and line charts require at least one column for each axis/
    );
  });
});
