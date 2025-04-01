import { formatChartLabel } from './formatChartLabel';
import type { IColumnLabelFormat } from '@/api/asset_interfaces/metric/charts';

describe('formatChartLabel', () => {
  it('should format label correctly when hasCategoryAxis is true and hasMultipleMeasures is false', () => {
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
      }
    } satisfies Record<string, IColumnLabelFormat>;

    // Act
    let result = formatChartLabel('recent_total__🔑__', columnLabelFormats, true, false);
    expect(result).toBe('Recent Total');

    result = formatChartLabel('recent_total__🔑__', columnLabelFormats, false, false);
    expect(result).toBe('Recent Total');

    result = formatChartLabel('recent_total__🔑__', columnLabelFormats, false, true);
    expect(result).toBe('Recent Total');
  });
});
