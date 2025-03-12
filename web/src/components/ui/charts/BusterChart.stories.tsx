import type { Meta, StoryObj } from '@storybook/react';
import { BusterChart } from './BusterChart';
import { ChartType } from '../../../api/asset_interfaces/metric/charts/enum';
import { IColumnLabelFormat } from '../../../api/asset_interfaces/metric/charts/columnLabelInterfaces';
import {
  generateBarChartData,
  generateLineChartData,
  generatePieChartData,
  generateScatterChartData
} from '../../../mocks/chart/chartMocks';

// Type-safe column label formats for each chart type
type LineChartData = ReturnType<typeof generateLineChartData>[0];
type BarChartData = ReturnType<typeof generateBarChartData>[0];
type PieChartData = ReturnType<typeof generatePieChartData>[0];
type ScatterChartData = ReturnType<typeof generateScatterChartData>[0];

const meta: Meta<typeof BusterChart> = {
  title: 'UI/Charts/BusterChart',
  component: BusterChart,
  parameters: {
    layout: 'centered'
  },
  argTypes: {
    className: {
      control: false,
      defaultValue: 'w-[800px] h-[400px]'
    }
  }
};

export default meta;
type Story = StoryObj<typeof BusterChart>;

export const LineChart: Story = {
  args: {
    selectedChartType: ChartType.Line,
    data: generateLineChartData(),
    barAndLineAxis: {
      x: ['date'],
      y: ['revenue', 'profit', 'customers'],
      category: []
    },
    className: 'w-[800px] h-[400px]',
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'MMM DD'
      } satisfies IColumnLabelFormat,
      revenue: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      } satisfies IColumnLabelFormat,
      profit: {
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      } satisfies IColumnLabelFormat,
      customers: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat
    } satisfies Record<keyof LineChartData, IColumnLabelFormat>
  }
};

export const BarChart: Story = {
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

export const PieChart: Story = {
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

export const ScatterChart: Story = {
  args: {
    selectedChartType: ChartType.Scatter,
    data: generateScatterChartData(),
    scatterAxis: {
      x: ['x'],
      y: ['y'],
      size: ['size'],
      category: ['category']
    },
    columnLabelFormats: {
      x: {
        columnType: 'number',
        style: 'number',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      } satisfies IColumnLabelFormat,
      y: {
        columnType: 'number',
        style: 'number',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      } satisfies IColumnLabelFormat,
      size: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat,
      category: {
        columnType: 'text',
        style: 'string'
      } satisfies IColumnLabelFormat
    } satisfies Record<keyof ScatterChartData, IColumnLabelFormat>,
    className: 'w-[800px] h-[600px]'
  }
};
