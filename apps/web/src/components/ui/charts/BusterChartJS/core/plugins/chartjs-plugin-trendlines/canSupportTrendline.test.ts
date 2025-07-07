import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BusterChartProps } from '@/api/asset_interfaces/metric/charts';
import { isNumericColumnType } from '@/lib/messages';
import { canSupportTrendlineRecord } from './canSupportTrendline';
import {
  DEFAULT_COLUMN_LABEL_FORMAT,
  type ColumnLabelFormat,
  type Trendline
} from '@buster/server-shared/metrics';

// Mock the isNumericColumnType function
vi.mock('@/lib/messages', () => ({
  isNumericColumnType: vi.fn()
}));

const mockedIsNumericColumnType = vi.mocked(isNumericColumnType);

describe('canSupportTrendlineRecord', () => {
  const trendlineTypes: Trendline['type'][] = [
    'linear_regression',
    'logarithmic_regression',
    'exponential_regression',
    'polynomial_regression',
    'min',
    'max',
    'median',
    'average'
  ];

  const columnId = 'test-column';
  const mockColumnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']> = {
    [columnId]: {
      columnType: 'number',
      style: 'number'
    } as ColumnLabelFormat
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test.each(trendlineTypes)(
    'returns true when %s trendline has a numeric column type',
    (trendlineType) => {
      // Arrange
      mockedIsNumericColumnType.mockReturnValue(true);
      const trendline: Trendline = {
        type: trendlineType,
        columnId,
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Test Label'
      } as Trendline;

      // Act
      const result = canSupportTrendlineRecord[trendlineType](mockColumnLabelFormats, trendline);

      // Assert
      expect(result).toBe(true);
      expect(mockedIsNumericColumnType).toHaveBeenCalledWith('number');
    }
  );

  test.each(trendlineTypes)(
    'returns false when %s trendline has a non-numeric column type',
    (trendlineType) => {
      // Arrange
      mockedIsNumericColumnType.mockReturnValue(false);
      const trendline: Trendline = {
        type: trendlineType,
        columnId,
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Test Label'
      } as Trendline;

      // Act
      const result = canSupportTrendlineRecord[trendlineType](mockColumnLabelFormats, trendline);

      // Assert
      expect(result).toBe(false);
      expect(mockedIsNumericColumnType).toHaveBeenCalledWith('number');
    }
  );

  test.each(trendlineTypes)(
    'uses DEFAULT_COLUMN_LABEL_FORMAT when column format not provided for %s',
    (trendlineType) => {
      // Arrange
      mockedIsNumericColumnType.mockReturnValue(true);
      const trendline: Trendline = {
        type: trendlineType,
        columnId: 'non-existent',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Test Label'
      } as Trendline;

      // Act
      const result = canSupportTrendlineRecord[trendlineType](mockColumnLabelFormats, trendline);

      // Assert
      expect(result).toBe(true);
      expect(mockedIsNumericColumnType).toHaveBeenCalledWith(
        DEFAULT_COLUMN_LABEL_FORMAT.columnType
      );
    }
  );
  it('confirms all trendline types are tested', () => {
    // This test ensures we've covered all trendline types in our tests
    const allTrendlineTypes = Object.keys(canSupportTrendlineRecord) as Trendline['type'][];
    expect(allTrendlineTypes.sort()).toEqual(trendlineTypes.sort());
  });
});
