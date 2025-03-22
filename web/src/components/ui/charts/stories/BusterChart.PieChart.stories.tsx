import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { BusterChart } from '../BusterChart';
import { ChartType } from '../../../../api/asset_interfaces/metric/charts/enum';
import { IColumnLabelFormat } from '../../../../api/asset_interfaces/metric/charts/columnLabelInterfaces';
import { generatePieChartData } from '../../../../mocks/chart/chartMocks';
import { sharedMeta } from './BusterChartShared';

type PieChartData = ReturnType<typeof generatePieChartData>;

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

export const MultipleValues: Story = {
  args: {
    selectedChartType: ChartType.Pie,
    data: [
      { segment: 'A', value1: 30, value2: 45 },
      { segment: 'B', value1: 20, value2: 25 },
      { segment: 'C', value1: 50, value2: 30 }
    ],
    pieChartAxis: {
      x: ['segment'],
      y: ['value1', 'value2']
    },
    columnLabelFormats: {
      segment: {
        columnType: 'text',
        style: 'string'
      } satisfies IColumnLabelFormat,
      value1: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat,
      value2: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat
    },
    pieDisplayLabelAs: 'percent',
    pieDonutWidth: 0,
    className: 'w-[500px] h-[500px]'
  }
};

export const Donut: Story = {
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
    pieDonutWidth: 0.6,
    className: 'w-[500px] h-[500px]'
  }
};

export const DonutMultipleValues: Story = {
  args: {
    selectedChartType: ChartType.Pie,
    data: [
      { segment: 'A', value1: 30, value2: 45 },
      { segment: 'B', value1: 20, value2: 25 },
      { segment: 'C', value1: 50, value2: 30 }
    ],
    pieChartAxis: {
      x: ['segment'],
      y: ['value1', 'value2']
    },
    columnLabelFormats: {
      segment: {
        columnType: 'text',
        style: 'string'
      } satisfies IColumnLabelFormat,
      value1: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat,
      value2: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat
    },
    pieDisplayLabelAs: 'percent',
    pieDonutWidth: 0.7,
    className: 'w-[500px] h-[500px]'
  }
};

export const ResizableContainer: Story = {
  render: (args) => (
    <div className="h-[500px] min-h-[200px] w-[500px] min-w-[200px] resize overflow-auto rounded-lg border border-gray-200 p-4">
      <BusterChart {...args} className="h-full w-full" />
    </div>
  ),
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
    pieDonutWidth: 0
  },
  parameters: {
    docs: {
      description: {
        story:
          'This story provides a resizable container. Drag the bottom-right corner to resize the chart.'
      }
    }
  }
};
