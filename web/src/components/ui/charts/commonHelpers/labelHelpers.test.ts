import { formatChartValueDelimiter } from './labelHelpers';
import type { ColumnLabelFormat, IColumnLabelFormat } from '@/api/asset_interfaces/metric/charts';

describe('formatChartValueDelimiter', () => {
  it('should format a numeric value using the column format', () => {
    const rawValue = 1234.56;
    const columnNameDelimiter = 'value__🔑__';
    const columnLabelFormats: Record<string, IColumnLabelFormat> = {
      value: {
        style: 'number',
        columnType: 'number',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }
    };

    const result = formatChartValueDelimiter(rawValue, columnNameDelimiter, columnLabelFormats);
    expect(result).toBe('1,234.6');
  });

  it('If the key is not found, it will fallback to the default format', () => {
    const rawValue = 1234.56;
    const columnNameDelimiter = 'THIS_IS_INVALID_KEY';
    const columnLabelFormats: Record<string, IColumnLabelFormat> = {
      value: {
        style: 'number',
        columnType: 'number',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }
    };

    const result = formatChartValueDelimiter(rawValue, columnNameDelimiter, columnLabelFormats);
    expect(result).toBe('1234.56');
  });

  it('should return a valid dollar format', () => {
    const rawValue = 3363690.3966666665;
    const columnNameDelimiter = 'long_term_avg__🔑__';
    const columnLabelFormats: Record<string, IColumnLabelFormat> = {
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
      }
    };

    const result = formatChartValueDelimiter(rawValue, columnNameDelimiter, columnLabelFormats);
    expect(result).toBe('$3,363,690.40');
  });
});
