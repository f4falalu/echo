import { formatBarAndLineDataLabel } from './formatBarAndLineDataLabel';
import { ColumnLabelFormat } from '@/api/asset_interfaces/metric';
import { Context } from 'chartjs-plugin-datalabels';

describe('formatBarAndLineDataLabel', () => {
  it('formats a single value without percentage', () => {
    const value = 1234.56;
    const columnLabelFormat: ColumnLabelFormat = {
      style: 'number',
      columnType: 'number',
      numberSeparatorStyle: ',',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    };

    const mockContext = {
      chart: {
        data: {
          datasets: []
        },
        $totalizer: {
          stackTotals: [],
          seriesTotals: []
        }
      },
      active: false,
      dataIndex: 0,
      dataset: {},
      datasetIndex: 0
    } as unknown as Context;

    const result = formatBarAndLineDataLabel(value, mockContext, false, columnLabelFormat);

    expect(result).toBe('1,234.56');
  });
});
