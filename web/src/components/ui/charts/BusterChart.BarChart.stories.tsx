import type { Meta, StoryObj } from '@storybook/react';
import { BusterChart } from './BusterChart';
import { ChartType } from '../../../api/asset_interfaces/metric/charts/enum';
import { IColumnLabelFormat } from '../../../api/asset_interfaces/metric/charts/columnLabelInterfaces';
import { generateBarChartData } from '../../../mocks/chart/chartMocks';
import { sharedMeta } from './BusterChart.shared';

type BarChartData = ReturnType<typeof generateBarChartData>[0];

const meta: Meta<typeof BusterChart> = {
  ...sharedMeta,
  title: 'UI/Charts/BusterChart/Bar'
} as Meta<typeof BusterChart>;

export default meta;
type Story = StoryObj<typeof BusterChart>;

export const Default: Story = {
  args: {
    selectedChartType: ChartType.Bar,
    data: generateBarChartData(),
    barAndLineAxis: {
      x: ['category'],
      y: ['sales', 'units', 'returns'],
      category: []
    },
    columnLabelFormats: {
      category: {
        columnType: 'text',
        style: 'string'
      } satisfies IColumnLabelFormat,
      sales: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      } satisfies IColumnLabelFormat,
      units: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat,
      returns: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat
    } satisfies Record<keyof BarChartData, IColumnLabelFormat>,
    className: 'w-[800px] h-[400px]'
  }
};
