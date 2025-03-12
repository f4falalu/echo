import type { Meta, StoryObj } from '@storybook/react';
import { BusterChart } from './BusterChart';
import { ChartType } from '../../../api/asset_interfaces/metric/charts/enum';
import { IColumnLabelFormat } from '../../../api/asset_interfaces/metric/charts/columnLabelInterfaces';
import { generatePieChartData } from '../../../mocks/chart/chartMocks';
import { sharedMeta } from './BusterChart.shared';

type PieChartData = ReturnType<typeof generatePieChartData>[0];

const meta: Meta<typeof BusterChart> = {
  ...sharedMeta,
  title: 'UI/Charts/BusterChart/Pie'
} as Meta<typeof BusterChart>;

export default meta;
type Story = StoryObj<typeof BusterChart>;

export const Default: Story = {
  args: {
    selectedChartType: ChartType.Pie,
    data: generatePieChartData(),
    pieChartAxis: {
      x: ['segment'],
      y: ['value']
    },
    columnLabelFormats: {
      segment: {
        columnType: 'text',
        style: 'string'
      } satisfies IColumnLabelFormat,
      value: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat
    } satisfies Record<keyof PieChartData, IColumnLabelFormat>,
    pieDisplayLabelAs: 'percent',
    pieDonutWidth: 0,
    className: 'w-[500px] h-[500px]'
  }
};
