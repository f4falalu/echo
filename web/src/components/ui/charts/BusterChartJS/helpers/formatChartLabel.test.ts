import { formatChartLabel } from './formatChartLabel';
import type { BusterChartProps, IColumnLabelFormat } from '@/api/asset_interfaces/metric/charts';

describe('formatChartLabel', () => {
  const columnLabelFormats = {
    month: {
      style: 'date',
      compactNumbers: false,
      columnType: 'date',
      displayName: '',
      numberSeparatorStyle: ',',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      currency: 'USD',
      convertNumberTo: null,
      dateFormat: 'MMM YYYY',
      useRelativeTime: false,
      isUTC: false,
      multiplier: 1,
      prefix: '',
      suffix: '',
      replaceMissingDataWith: null,
      makeLabelHumanReadable: true
    },
    recent_total: {
      style: 'currency',
      compactNumbers: false,
      columnType: 'number',
      displayName: '',
      numberSeparatorStyle: ',',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      currency: 'USD',
      convertNumberTo: null,
      dateFormat: 'auto',
      useRelativeTime: false,
      isUTC: false,
      multiplier: 1,
      prefix: '',
      suffix: '',
      replaceMissingDataWith: 0,
      makeLabelHumanReadable: true
    },
    long_term_avg: {
      style: 'currency',
      compactNumbers: false,
      columnType: 'number',
      displayName: '',
      numberSeparatorStyle: ',',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      currency: 'USD',
      convertNumberTo: null,
      dateFormat: 'auto',
      useRelativeTime: false,
      isUTC: false,
      multiplier: 1,
      prefix: '',
      suffix: '',
      replaceMissingDataWith: 0,
      makeLabelHumanReadable: true
    },
    custom_field: {
      style: 'number',
      compactNumbers: true,
      columnType: 'number',
      displayName: 'Custom Display',
      numberSeparatorStyle: ',',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
      prefix: '(',
      suffix: ')',
      makeLabelHumanReadable: true
    },
    percentage: {
      style: 'percent',
      compactNumbers: false,
      columnType: 'number',
      displayName: '',
      numberSeparatorStyle: ',',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
      makeLabelHumanReadable: true
    }
  } satisfies NonNullable<BusterChartProps['columnLabelFormats']>;

  it('should format label correctly when hasCategoryAxis is true and hasMultipleMeasures is false', () => {
    // Act
    let result = formatChartLabel('recent_total__🔑__', columnLabelFormats, true, false);
    expect(result).toBe('Recent Total');

    result = formatChartLabel('recent_total__🔑__', columnLabelFormats, false, false);
    expect(result).toBe('Recent Total');

    result = formatChartLabel('recent_total__🔑__', columnLabelFormats, false, true);
    expect(result).toBe('Recent Total');
  });

  it('should handle date type fields correctly', () => {
    const result = formatChartLabel('month__🔑__2023-01-01', columnLabelFormats, true, false);
    expect(result).toBe('Jan 2023');
  });

  it('should handle fields with custom display names', () => {
    const columnLabelFormats = {
      custom_field: {
        displayName: 'Custom Display',
        columnType: 'text',
        style: 'string'
      }
    } satisfies NonNullable<BusterChartProps['columnLabelFormats']>;
    let result = formatChartLabel('custom_field__🔑__value', columnLabelFormats, true, false);
    expect(result).toBe('value');

    result = formatChartLabel('custom_field__🔑__value', columnLabelFormats, false, false);
    expect(result).toBe('Value');

    expect(result).toBe('Value');

    result = formatChartLabel('custom_field__🔑__value', columnLabelFormats, false, true);
    expect(result).toBe('value');
  });

  it('should format number values correctly', () => {
    const columnLabelFormats = {
      numeric_field: {
        style: 'number',
        compactNumbers: false,
        columnType: 'number',
        displayName: '',
        numberSeparatorStyle: ',',
        minimumFractionDigits: 1,
        maximumFractionDigits: 2,
        currency: 'USD',
        convertNumberTo: null,
        dateFormat: 'auto',
        useRelativeTime: false,
        isUTC: false,
        multiplier: 1,
        prefix: '$',
        suffix: ' USD',
        replaceMissingDataWith: 0,
        makeLabelHumanReadable: true
      }
    } satisfies NonNullable<BusterChartProps['columnLabelFormats']>;

    const result = formatChartLabel('numeric_field__🔑__1234.567', columnLabelFormats, true, false);
    expect(result).toBe('$1,234.57 USD');
  });
});
