import type { Meta, StoryObj } from '@storybook/react';
import { BusterChart } from '../BusterChart';
import { ChartType } from '../../../../api/asset_interfaces/metric/charts/enum';
import { IColumnLabelFormat } from '../../../../api/asset_interfaces/metric/charts/columnLabelInterfaces';
import { faker } from '@faker-js/faker';
import { sharedMeta } from './BusterChartShared';

interface ComboChartDataPoint {
  date: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
}

// Generate mock data for combo chart with revenue, orders, and average order value
const generateComboChartData = (
  pointCount = 10
): Record<string, string | number | Date | null>[] => {
  const data: Record<string, string | number | Date | null>[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - pointCount);

  for (let i = 0; i < pointCount; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    data.push({
      date: date.toISOString(),
      revenue: faker.number.int({ min: 10000, max: 50000 }),
      orders: faker.number.int({ min: 100, max: 500 }),
      averageOrderValue: faker.number.int({ min: 50, max: 200 })
    });
  }
  return data;
};

type ComboChartData = ComboChartDataPoint;

const meta: Meta<typeof BusterChart> = {
  ...sharedMeta,
  title: 'UI/Charts/BusterChart/Combo'
} as Meta<typeof BusterChart>;

export default meta;
type Story = StoryObj<typeof BusterChart>;

export const DualAxisCombo: Story = {
  args: {
    selectedChartType: ChartType.Combo,
    data: generateComboChartData(),
    comboChartAxis: {
      x: ['date'],
      y: ['revenue'],
      y2: ['averageOrderValue'],
      tooltip: ['revenue', 'averageOrderValue']
    },
    columnSettings: {
      revenue: {
        columnVisualization: 'bar'
      },
      averageOrderValue: {
        columnVisualization: 'line',
        lineSymbolSize: 4,
        lineWidth: 2
      }
    },
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'MMM D, YYYY'
      } satisfies IColumnLabelFormat,
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat,
      orders: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat,
      averageOrderValue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat
    } satisfies Record<keyof ComboChartData, IColumnLabelFormat>,
    yAxisAxisTitle: 'Revenue',
    y2AxisAxisTitle: 'Average Order Value',
    gridLines: true,
    showLegend: true,
    className: 'w-[800px] h-[400px]'
  }
};
