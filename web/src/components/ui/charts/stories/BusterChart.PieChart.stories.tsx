import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { BusterChart } from '../BusterChart';
import { ChartType } from '../../../../api/asset_interfaces/metric/charts/enum';
import { IColumnLabelFormat } from '../../../../api/asset_interfaces/metric/charts/columnLabelInterfaces';
import { generatePieChartData } from '../../../../mocks/chart/chartMocks';
import { sharedMeta } from './BusterChartShared';
import { faker } from '@faker-js/faker';

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
    pieDisplayLabelAs: 'number',
    pieDonutWidth: 50,
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
    pieDonutWidth: 20,
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
    pieDonutWidth: 10,
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
    pieDisplayLabelAs: 'number',
    pieDonutWidth: 10,
    pieInnerLabelTitle: 'Total',
    pieInnerLabelAggregate: 'sum'
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

export const WithSortingByKey: Story = {
  args: {
    selectedChartType: ChartType.Pie,
    data: Array.from({ length: 8 }, (_, index) => ({
      segment: faker.word.adjective(),
      value:
        index === 1 || index === 5
          ? faker.number.int({ min: 10, max: 25 })
          : faker.number.int({ min: 50, max: 150 })
    })),
    pieChartAxis: {
      x: ['segment'],
      y: ['value']
    },
    pieSortBy: 'key',
    columnMetadata: [
      {
        name: 'segment',
        simple_type: 'text',
        min_value: 0,
        max_value: 100,
        unique_values: 10,
        type: 'text'
      },
      {
        name: 'value',
        simple_type: 'number',
        min_value: 0,
        max_value: 100,
        unique_values: 10,
        type: 'number'
      }
    ]
  }
};

export const WithSortingByKeyWithDates: Story = {
  args: {
    selectedChartType: ChartType.Pie,
    data: Array.from({ length: 8 }, (_, index) => ({
      date: faker.date.recent({ days: 180 }).toISOString(),
      value:
        index === 1 || index === 5
          ? faker.number.int({ min: 10, max: 25 })
          : faker.number.int({ min: 50, max: 150 })
    })),
    pieChartAxis: {
      x: ['date'],
      y: ['value']
    },
    pieSortBy: 'key',
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date'
      } satisfies IColumnLabelFormat
    },
    columnMetadata: [
      {
        name: 'date',
        simple_type: 'date',
        min_value: 0,
        max_value: 100,
        unique_values: 10,
        type: 'date'
      },
      {
        name: 'value',
        simple_type: 'number',
        min_value: 0,
        max_value: 100,
        unique_values: 10,
        type: 'number'
      }
    ]
  }
};

export const WithSortingByValue: Story = {
  args: {
    ...WithSortingByKey.args!,
    pieSortBy: 'value'
  }
};

export const ShowLabelAsPercent: Story = {
  render: (args) => (
    <div className="h-[500px] min-h-[200px] w-[500px] min-w-[200px] resize overflow-auto rounded-lg border border-gray-200 p-4">
      <BusterChart {...args} className="h-full w-full" />
    </div>
  ),
  args: {
    selectedChartType: ChartType.Pie,
    data: Array.from({ length: 5 }, () => ({
      segment: faker.word.adjective(),
      value: faker.number.int({ min: 10, max: 100 }),
      value2: faker.number.int({ min: 10, max: 100 })
    })),
    pieChartAxis: {
      x: ['segment'],
      y: ['value', 'value2']
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
      } satisfies IColumnLabelFormat,
      value2: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat
    } satisfies Record<keyof PieChartData, IColumnLabelFormat>,
    pieDisplayLabelAs: 'percent',
    pieDonutWidth: 5,
    pieInnerLabelTitle: 'Total',
    pieShowInnerLabel: false,
    pieLabelPosition: 'inside',
    pieInnerLabelAggregate: 'sum'
  }
};

export const ManyValuesWithDataLabels: Story = {
  args: {
    selectedChartType: ChartType.Pie,
    columnSettings: {
      value: {
        showDataLabels: true
      }
    },
    columnLabelFormats: {
      value: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat
    },
    data: Array.from({ length: 50 }, () => ({
      segment: faker.word.adjective(),
      value: faker.number.int({ min: 10, max: 100 })
    })),
    pieChartAxis: {
      x: ['segment'],
      y: ['value']
    },
    pieDisplayLabelAs: 'number',
    pieLabelPosition: 'inside',
    pieDonutWidth: 0
  }
};

export const DataLabelsOutside: Story = {
  args: {
    selectedChartType: ChartType.Pie,
    data: Array.from({ length: 5 }, () => ({
      segment: faker.word.adjective(),
      value: faker.number.int({ min: 10, max: 100 })
    })),
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
      } satisfies IColumnLabelFormat,
      value2: {
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } satisfies IColumnLabelFormat
    } satisfies Record<keyof PieChartData, IColumnLabelFormat>,
    pieLabelPosition: 'outside'
  }
};
