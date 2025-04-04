import { formatXAxisLabel, formatYAxisLabel, yAxisSimilar } from './axisHelper';
import { formatLabel } from '@/lib/columnFormatter';
import { formatChartLabelDelimiter } from './labelHelpers';
import { ChartType } from '@/api/asset_interfaces/metric/charts';
import type { SimplifiedColumnType, ColumnMetaData } from '@/api/asset_interfaces/metric';

// Mock dependencies
jest.mock('@/lib/columnFormatter', () => ({
  formatLabel: jest.fn()
}));

jest.mock('./labelHelpers', () => ({
  formatChartLabelDelimiter: jest.fn()
}));

describe('formatXAxisLabel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should format a number value using formatLabel', () => {
    // Setup
    const value = 1000;
    const selectedAxis = { x: ['revenue'], y: ['growth'] };
    const columnLabelFormats = {
      revenue: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'currency' as const,
        currency: 'USD'
      }
    };
    const xAxisColumnMetadata: ColumnMetaData = {
      name: 'revenue',
      min_value: 0,
      max_value: 5000,
      unique_values: 100,
      simple_type: 'number',
      type: 'float'
    };
    const selectedChartType = ChartType.Bar;

    // Execute
    const result = formatXAxisLabel(
      value,
      selectedAxis,
      columnLabelFormats,
      xAxisColumnMetadata,
      selectedChartType
    );

    // Verify
    expect(formatLabel).toHaveBeenCalledWith(value, {
      columnType: 'number',
      style: 'currency',
      currency: 'USD',
      compactNumbers: true
    });
  });

  it('should use formatLabel for Scatter charts even with string values', () => {
    // Setup
    const value = 'some-string';
    const selectedAxis = { x: ['category'], y: ['count'] };
    const columnLabelFormats = {
      category: {
        columnType: 'text' as SimplifiedColumnType,
        style: 'string' as const
      }
    };
    const xAxisColumnMetadata = undefined;
    const selectedChartType = ChartType.Scatter;

    // Execute
    formatXAxisLabel(
      value,
      selectedAxis,
      columnLabelFormats,
      xAxisColumnMetadata,
      selectedChartType
    );

    // Verify
    expect(formatLabel).toHaveBeenCalledWith(value, {
      columnType: 'text',
      style: 'string',
      compactNumbers: false
    });
  });

  it('should not use compact numbers when range is small', () => {
    // Setup
    const value = 100;
    const selectedAxis = { x: ['smallValue'], y: ['count'] };
    const columnLabelFormats = {
      smallValue: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'number' as const
      }
    };
    const xAxisColumnMetadata: ColumnMetaData = {
      name: 'smallValue',
      min_value: 0,
      max_value: 500,
      unique_values: 50,
      simple_type: 'number',
      type: 'float'
    };
    const selectedChartType = ChartType.Line;

    // Execute
    formatXAxisLabel(
      value,
      selectedAxis,
      columnLabelFormats,
      xAxisColumnMetadata,
      selectedChartType
    );

    // Verify
    expect(formatLabel).toHaveBeenCalledWith(value, {
      columnType: 'number',
      style: 'number',
      compactNumbers: false
    });
  });

  it('should use compact numbers when range is large', () => {
    // Setup
    const value = 5000;
    const selectedAxis = { x: ['largeValue'], y: ['count'] };
    const columnLabelFormats = {
      largeValue: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'number' as const
      }
    };
    const xAxisColumnMetadata: ColumnMetaData = {
      name: 'largeValue',
      min_value: 0,
      max_value: 10000,
      unique_values: 200,
      simple_type: 'number',
      type: 'float'
    };
    const selectedChartType = ChartType.Bar;

    // Execute
    formatXAxisLabel(
      value,
      selectedAxis,
      columnLabelFormats,
      xAxisColumnMetadata,
      selectedChartType
    );

    // Verify
    expect(formatLabel).toHaveBeenCalledWith(value, {
      columnType: 'number',
      style: 'number',
      compactNumbers: true
    });
  });

  it('should use formatChartLabelDelimiter for string values in non-scatter charts', () => {
    // Setup
    const value = 'category-name';
    const selectedAxis = { x: ['category'], y: ['count'] };
    const columnLabelFormats = {
      category: {
        columnType: 'text' as SimplifiedColumnType,
        style: 'string' as const
      }
    };
    const xAxisColumnMetadata = undefined;
    const selectedChartType = ChartType.Bar;

    // Execute
    formatXAxisLabel(
      value,
      selectedAxis,
      columnLabelFormats,
      xAxisColumnMetadata,
      selectedChartType
    );

    // Verify
    expect(formatChartLabelDelimiter).toHaveBeenCalledWith(value, columnLabelFormats);
  });
});

describe('formatYAxisLabel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should use percentage formatting when usePercentageModeAxis is true', () => {
    // Setup
    const value = 0.75;
    const axisColumnNames = ['growth', 'revenue'];
    const canUseSameFormatter = true;
    const columnLabelFormats = {
      growth: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'number' as const
      },
      revenue: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'currency' as const,
        currency: 'USD'
      }
    };
    const usePercentageModeAxis = true;

    // Execute
    const result = formatYAxisLabel(
      value,
      axisColumnNames,
      canUseSameFormatter,
      columnLabelFormats,
      usePercentageModeAxis
    );

    // Verify
    expect(formatLabel).toHaveBeenCalledWith(
      value,
      { columnType: 'number', style: 'percent' },
      false
    );
  });

  it('should use the first column format when canUseSameFormatter is true', () => {
    // Setup
    const value = 1000;
    const axisColumnNames = ['revenue', 'cost'];
    const canUseSameFormatter = true;
    const columnLabelFormats = {
      revenue: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'currency' as const,
        currency: 'USD'
      },
      cost: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'currency' as const,
        currency: 'EUR'
      }
    };
    const usePercentageModeAxis = false;
    const compactNumbers = true;

    // Execute
    formatYAxisLabel(
      value,
      axisColumnNames,
      canUseSameFormatter,
      columnLabelFormats,
      usePercentageModeAxis,
      compactNumbers
    );

    // Verify
    expect(formatLabel).toHaveBeenCalledWith(
      value,
      {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        compactNumbers: true
      },
      false
    );
  });

  it('should use generic number format when canUseSameFormatter is false', () => {
    // Setup
    const value = 1000;
    const axisColumnNames = ['revenue', 'growth'];
    const canUseSameFormatter = false;
    const columnLabelFormats = {
      revenue: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'currency' as const,
        currency: 'USD'
      },
      growth: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'percent' as const
      }
    };
    const usePercentageModeAxis = false;
    const compactNumbers = true;

    // Execute
    formatYAxisLabel(
      value,
      axisColumnNames,
      canUseSameFormatter,
      columnLabelFormats,
      usePercentageModeAxis,
      compactNumbers
    );

    // Verify
    expect(formatLabel).toHaveBeenCalledWith(
      value,
      {
        columnType: 'number',
        style: 'number',
        compactNumbers: true
      },
      false
    );
  });

  it('should respect the compactNumbers parameter when false', () => {
    // Setup
    const value = 10000;
    const axisColumnNames = ['count'];
    const canUseSameFormatter = true;
    const columnLabelFormats = {
      count: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'number' as const
      }
    };
    const usePercentageModeAxis = false;
    const compactNumbers = false;

    // Execute
    formatYAxisLabel(
      value,
      axisColumnNames,
      canUseSameFormatter,
      columnLabelFormats,
      usePercentageModeAxis,
      compactNumbers
    );

    // Verify
    expect(formatLabel).toHaveBeenCalledWith(
      value,
      {
        columnType: 'number',
        style: 'number',
        compactNumbers: false
      },
      false
    );
  });

  it('should default compactNumbers to true if not provided', () => {
    // Setup
    const value = 10000;
    const axisColumnNames = ['count'];
    const canUseSameFormatter = true;
    const columnLabelFormats = {
      count: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'number' as const
      }
    };
    const usePercentageModeAxis = false;
    // No compactNumbers parameter provided

    // Execute
    formatYAxisLabel(
      value,
      axisColumnNames,
      canUseSameFormatter,
      columnLabelFormats,
      usePercentageModeAxis
    );

    // Verify
    expect(formatLabel).toHaveBeenCalledWith(
      value,
      {
        columnType: 'number',
        style: 'number',
        compactNumbers: true
      },
      false
    );
  });
});

describe('yAxisSimilar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true when all y-axis variables have the same style and currency', () => {
    // Setup
    const yAxis = ['revenue', 'sales'];
    const columnLabelFormats = {
      revenue: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'currency' as const,
        currency: 'USD'
      },
      sales: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'currency' as const,
        currency: 'USD'
      }
    };

    // Execute
    const result = yAxisSimilar(yAxis, columnLabelFormats);

    // Verify
    expect(result).toBe(true);
  });

  it('should return false when y-axis variables have different styles', () => {
    // Setup
    const yAxis = ['revenue', 'percentage'];
    const columnLabelFormats = {
      revenue: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'currency' as const,
        currency: 'USD'
      },
      percentage: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'percent' as const
      }
    };

    // Execute
    const result = yAxisSimilar(yAxis, columnLabelFormats);

    // Verify
    expect(result).toBe(false);
  });

  it('should return false when y-axis variables have different currencies', () => {
    // Setup
    const yAxis = ['usd_revenue', 'eur_revenue'];
    const columnLabelFormats = {
      usd_revenue: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'currency' as const,
        currency: 'USD'
      },
      eur_revenue: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'currency' as const,
        currency: 'EUR'
      }
    };

    // Execute
    const result = yAxisSimilar(yAxis, columnLabelFormats);

    // Verify
    expect(result).toBe(false);
  });

  it('should return true for a single y-axis variable', () => {
    // Setup
    const yAxis = ['revenue'];
    const columnLabelFormats = {
      revenue: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'currency' as const,
        currency: 'USD'
      }
    };

    // Execute
    const result = yAxisSimilar(yAxis, columnLabelFormats);

    // Verify
    expect(result).toBe(true);
  });

  it('should handle y-axis variables with missing format properties', () => {
    // Setup
    const yAxis = ['value1', 'value2'];
    const columnLabelFormats = {
      value1: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'number' as const
      },
      value2: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'number' as const
      }
    };

    // Execute
    const result = yAxisSimilar(yAxis, columnLabelFormats);

    // Verify
    expect(result).toBe(true);
  });
});
