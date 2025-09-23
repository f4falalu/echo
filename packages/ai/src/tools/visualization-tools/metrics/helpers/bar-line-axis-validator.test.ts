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

  it('should automatically set barGroupType to percentage-stack for percent-styled Y columns', () => {
    const chartConfig = {
      selectedChartType: 'bar',
      barGroupType: 'stack',
      columnLabelFormats: {
        subcategory_name: {
          columnType: 'text',
          style: 'string',
        },
        percentage: {
          columnType: 'number',
          style: 'percent',
        },
      },
      barAndLineAxis: {
        x: ['subcategory_name'],
        y: ['percentage'],
      },
    } as any;

    const result = validateAndAdjustBarLineAxes(chartConfig);
    expect(result.barGroupType).toBe('percentage-stack');
  });

  it('should not change barGroupType for non-bar charts with percent columns', () => {
    const chartConfig = {
      selectedChartType: 'line',
      lineGroupType: 'stack',
      columnLabelFormats: {
        month: {
          columnType: 'date',
          style: 'string',
        },
        percentage: {
          columnType: 'number',
          style: 'percent',
        },
      },
      barAndLineAxis: {
        x: ['month'],
        y: ['percentage'],
      },
    } as any;

    const result = validateAndAdjustBarLineAxes(chartConfig);
    expect(result.lineGroupType).toBe('stack'); // Should remain unchanged
  });

  it('should not change barGroupType if it is not already stack', () => {
    const chartConfig = {
      selectedChartType: 'bar',
      barGroupType: 'group',
      columnLabelFormats: {
        category: {
          columnType: 'text',
          style: 'string',
        },
        percentage: {
          columnType: 'number',
          style: 'percent',
        },
      },
      barAndLineAxis: {
        x: ['category'],
        y: ['percentage'],
      },
    } as any;

    const result = validateAndAdjustBarLineAxes(chartConfig);
    expect(result.barGroupType).toBe('group'); // Should remain unchanged
  });

  it('should not change barGroupType if no Y columns have percent style', () => {
    const chartConfig = {
      selectedChartType: 'bar',
      barGroupType: 'stack',
      columnLabelFormats: {
        category: {
          columnType: 'text',
          style: 'string',
        },
        revenue: {
          columnType: 'number',
          style: 'currency',
        },
      },
      barAndLineAxis: {
        x: ['category'],
        y: ['revenue'],
      },
    } as any;

    const result = validateAndAdjustBarLineAxes(chartConfig);
    expect(result.barGroupType).toBe('stack'); // Should remain unchanged
  });

  it('should set percentage-stack when multiple Y columns include at least one percent', () => {
    const chartConfig = {
      selectedChartType: 'bar',
      barGroupType: 'stack',
      columnLabelFormats: {
        category: {
          columnType: 'text',
          style: 'string',
        },
        count: {
          columnType: 'number',
          style: 'number',
        },
        percentage: {
          columnType: 'number',
          style: 'percent',
        },
      },
      barAndLineAxis: {
        x: ['category'],
        y: ['count', 'percentage'],
      },
    } as any;

    const result = validateAndAdjustBarLineAxes(chartConfig);
    expect(result.barGroupType).toBe('percentage-stack');
  });
});
