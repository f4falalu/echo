import type { ColumnLabelFormat } from '@buster/server-shared/metrics';
import { describe, expect, it, vi } from 'vitest';
import { JOIN_CHARACTER } from '../../../lib/axisFormatter';
import { formatLabel } from '../../../lib/columnFormatter';
import type { BusterChartProps } from '../BusterChart.types';
import type { DatasetOption } from '../chartHooks';
import { formatLabelForDataset, formatLabelForPieLegend } from './labelHelpers';

// Mock the formatLabel function
vi.mock('@/lib/columnFormatter', () => ({
  formatLabel: vi.fn((value, format, useKey) => `formatted_${value}`),
}));

describe('labelHelpers', () => {
  describe('JOIN_CHARACTER', () => {
    it('should be defined as " | "', () => {
      expect(JOIN_CHARACTER).toBe(' | ');
    });
  });

  describe('formatLabelForDataset', () => {
    it('should format dataset labels and join them with JOIN_CHARACTER', () => {
      const dataset: DatasetOption = {
        id: 'test-id',
        label: [
          { key: 'key1', value: 'value1' },
          { key: 'key2', value: 'value2' },
        ],
        data: [1, 2, 3],
        dataKey: 'test-key',
        axisType: 'y',
        tooltipData: [[{ key: 'key1', value: 'value1' }], [{ key: 'key2', value: 'value2' }]],
      };

      const columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']> = {
        key1: { columnType: 'text', style: 'string' } as ColumnLabelFormat,
        key2: { columnType: 'text', style: 'string' } as ColumnLabelFormat,
      };

      const result = formatLabelForDataset(dataset, columnLabelFormats);
      expect(result).toBe('formatted_value1 | formatted_value2');
      expect(formatLabel).toHaveBeenCalledWith('value1', columnLabelFormats.key1, false);
      expect(formatLabel).toHaveBeenCalledWith('value2', columnLabelFormats.key2, false);
    });

    it('should use key when value is not provided', () => {
      const dataset: DatasetOption = {
        id: 'test-id',
        label: [
          { key: 'key1', value: null },
          { key: 'key2', value: 'value2' },
        ],
        data: [1, 2, 3],
        dataKey: 'test-key',
        axisType: 'y',
        tooltipData: [[{ key: 'key1', value: null }], [{ key: 'key2', value: 'value2' }]],
      };

      const columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']> = {
        key1: { columnType: 'text', style: 'string' } as ColumnLabelFormat,
        key2: { columnType: 'text', style: 'string' } as ColumnLabelFormat,
      };

      const result = formatLabelForDataset(dataset, columnLabelFormats);
      expect(result).toBe('formatted_key1 | formatted_value2');
      expect(formatLabel).toHaveBeenCalledWith('key1', columnLabelFormats.key1, true);
      expect(formatLabel).toHaveBeenCalledWith('value2', columnLabelFormats.key2, false);
    });
  });

  describe('formatLabelForPieLegend', () => {
    it('should join label and datasetLabel when isMultipleYAxis is true', () => {
      const result = formatLabelForPieLegend('label1', 'dataset1', true);
      expect(result).toBe('label1 | dataset1');
    });

    it('should return only label when isMultipleYAxis is false', () => {
      const result = formatLabelForPieLegend('label1', 'dataset1', false);
      expect(result).toBe('label1');
    });
  });
});
