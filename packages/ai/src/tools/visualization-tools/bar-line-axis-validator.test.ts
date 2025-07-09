import { describe, expect, it } from 'vitest';
import { validateAndAdjustBarLineAxes } from './bar-line-axis-validator';
import type { MetricYml } from './version-history-types';

describe('validateAndAdjustBarLineAxes', () => {
  it('should return valid for non-bar/line charts', () => {
    const metricYml: MetricYml = {
      name: 'Test Metric',
      description: 'Test description',
      timeFrame: '2024',
      sql: 'SELECT * FROM test',
      chartConfig: {
        selectedChartType: 'pie',
        columnLabelFormats: {},
      },
    };

    const result = validateAndAdjustBarLineAxes(metricYml);
    expect(result.isValid).toBe(true);
    expect(result.shouldSwapAxes).toBe(false);
  });

  it('should return valid when Y axis has numeric columns', () => {
    const metricYml: MetricYml = {
      name: 'Sales by Month',
      description: 'Monthly sales data',
      timeFrame: '2024',
      sql: 'SELECT month, sales FROM data',
      chartConfig: {
        selectedChartType: 'line',
        columnLabelFormats: {
          month: {
            columnType: 'date',
            style: 'date',
            replaceMissingDataWith: null,
            numberSeparatorStyle: null,
          },
          sales: {
            columnType: 'number',
            style: 'currency',
            replaceMissingDataWith: 0,
            numberSeparatorStyle: ',',
          },
        },
        barAndLineAxis: {
          x: ['month'],
          y: ['sales'],
        },
      },
    };

    const result = validateAndAdjustBarLineAxes(metricYml);
    expect(result.isValid).toBe(true);
    expect(result.shouldSwapAxes).toBe(false);
  });

  it('should swap axes when Y has non-numeric and X has numeric columns', () => {
    const metricYml: MetricYml = {
      name: 'Sales Rep by Revenue',
      description: 'Revenue by sales rep',
      timeFrame: '2024',
      sql: 'SELECT revenue, sales_rep FROM data',
      chartConfig: {
        selectedChartType: 'bar',
        columnLabelFormats: {
          revenue: {
            columnType: 'number',
            style: 'currency',
            replaceMissingDataWith: 0,
            numberSeparatorStyle: ',',
          },
          sales_rep: {
            columnType: 'string',
            style: 'string',
            replaceMissingDataWith: null,
            numberSeparatorStyle: null,
          },
        },
        barAndLineAxis: {
          x: ['revenue'],
          y: ['sales_rep'],
        },
      },
    };

    const result = validateAndAdjustBarLineAxes(metricYml);
    expect(result.isValid).toBe(true);
    expect(result.shouldSwapAxes).toBe(true);
    expect(result.adjustedYml).toBeDefined();
    expect(result.adjustedYml?.chartConfig?.barAndLineAxis?.x).toEqual(['sales_rep']);
    expect(result.adjustedYml?.chartConfig?.barAndLineAxis?.y).toEqual(['revenue']);
  });

  it('should return error when Y has non-numeric and X also has non-numeric columns', () => {
    const metricYml: MetricYml = {
      name: 'Categories by Region',
      description: 'Product categories by region',
      timeFrame: '2024',
      sql: 'SELECT region, category FROM data',
      chartConfig: {
        selectedChartType: 'line',
        columnLabelFormats: {
          region: {
            columnType: 'string',
            style: 'string',
            replaceMissingDataWith: null,
            numberSeparatorStyle: null,
          },
          category: {
            columnType: 'string',
            style: 'string',
            replaceMissingDataWith: null,
            numberSeparatorStyle: null,
          },
        },
        barAndLineAxis: {
          x: ['region'],
          y: ['category'],
        },
      },
    };

    const result = validateAndAdjustBarLineAxes(metricYml);
    expect(result.isValid).toBe(false);
    expect(result.shouldSwapAxes).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toContain('Bar and line charts require numeric values on the Y axis');
    expect(result.error).toContain('category (string)');
  });

  it('should handle multiple columns on axes', () => {
    const metricYml: MetricYml = {
      name: 'Multi Column Chart',
      description: 'Chart with multiple columns',
      timeFrame: '2024',
      sql: 'SELECT date, region, sales, profit FROM data',
      chartConfig: {
        selectedChartType: 'line',
        columnLabelFormats: {
          date: {
            columnType: 'date',
            style: 'date',
            replaceMissingDataWith: null,
            numberSeparatorStyle: null,
          },
          region: {
            columnType: 'string',
            style: 'string',
            replaceMissingDataWith: null,
            numberSeparatorStyle: null,
          },
          sales: {
            columnType: 'number',
            style: 'currency',
            replaceMissingDataWith: 0,
            numberSeparatorStyle: ',',
          },
          profit: {
            columnType: 'number',
            style: 'currency',
            replaceMissingDataWith: 0,
            numberSeparatorStyle: ',',
          },
        },
        barAndLineAxis: {
          x: ['date'],
          y: ['sales', 'profit'],
        },
      },
    };

    const result = validateAndAdjustBarLineAxes(metricYml);
    expect(result.isValid).toBe(true);
    expect(result.shouldSwapAxes).toBe(false);
  });

  it('should return error when Y has mixed numeric and non-numeric columns', () => {
    const metricYml: MetricYml = {
      name: 'Mixed Y Axis',
      description: 'Chart with mixed column types on Y',
      timeFrame: '2024',
      sql: 'SELECT month, sales, category FROM data',
      chartConfig: {
        selectedChartType: 'bar',
        columnLabelFormats: {
          month: {
            columnType: 'date',
            style: 'date',
            replaceMissingDataWith: null,
            numberSeparatorStyle: null,
          },
          sales: {
            columnType: 'number',
            style: 'currency',
            replaceMissingDataWith: 0,
            numberSeparatorStyle: ',',
          },
          category: {
            columnType: 'string',
            style: 'string',
            replaceMissingDataWith: null,
            numberSeparatorStyle: null,
          },
        },
        barAndLineAxis: {
          x: ['month'],
          y: ['sales', 'category'],
        },
      },
    };

    const result = validateAndAdjustBarLineAxes(metricYml);
    expect(result.isValid).toBe(false);
    expect(result.shouldSwapAxes).toBe(false);
    expect(result.error).toContain('category (string)');
  });

  it('should handle date columns as non-numeric', () => {
    const metricYml: MetricYml = {
      name: 'Date on Y Axis',
      description: 'Chart with date on Y axis',
      timeFrame: '2024',
      sql: 'SELECT sales, order_date FROM data',
      chartConfig: {
        selectedChartType: 'line',
        columnLabelFormats: {
          sales: {
            columnType: 'number',
            style: 'currency',
            replaceMissingDataWith: 0,
            numberSeparatorStyle: ',',
          },
          order_date: {
            columnType: 'date',
            style: 'date',
            replaceMissingDataWith: null,
            numberSeparatorStyle: null,
          },
        },
        barAndLineAxis: {
          x: ['sales'],
          y: ['order_date'],
        },
      },
    };

    const result = validateAndAdjustBarLineAxes(metricYml);
    expect(result.isValid).toBe(true);
    expect(result.shouldSwapAxes).toBe(true);
    expect(result.adjustedYml?.chartConfig?.barAndLineAxis?.x).toEqual(['order_date']);
    expect(result.adjustedYml?.chartConfig?.barAndLineAxis?.y).toEqual(['sales']);
  });

  it('should handle missing barAndLineAxis gracefully', () => {
    const metricYml: MetricYml = {
      name: 'Missing Axis Config',
      description: 'Chart without axis config',
      timeFrame: '2024',
      sql: 'SELECT * FROM data',
      chartConfig: {
        selectedChartType: 'bar',
        columnLabelFormats: {},
      },
    };

    const result = validateAndAdjustBarLineAxes(metricYml);
    expect(result.isValid).toBe(true);
    expect(result.shouldSwapAxes).toBe(false);
  });

  it('should handle empty axis arrays', () => {
    const metricYml: MetricYml = {
      name: 'Empty Axes',
      description: 'Chart with empty axes',
      timeFrame: '2024',
      sql: 'SELECT * FROM data',
      chartConfig: {
        selectedChartType: 'line',
        columnLabelFormats: {},
        barAndLineAxis: {
          x: [],
          y: [],
        },
      },
    };

    const result = validateAndAdjustBarLineAxes(metricYml);
    expect(result.isValid).toBe(false);
    expect(result.shouldSwapAxes).toBe(false);
  });
});
