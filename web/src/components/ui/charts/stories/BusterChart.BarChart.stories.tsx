import type { Meta, StoryObj } from '@storybook/react';
import { BusterChart } from '../BusterChart';
import { ChartType } from '../../../../api/asset_interfaces/metric/charts/enum';
import { IColumnLabelFormat } from '../../../../api/asset_interfaces/metric/charts/columnLabelInterfaces';
import { generateBarChartData } from '../../../../mocks/chart/chartMocks';
import { sharedMeta } from './BusterChartShared';
import { faker } from '@faker-js/faker';
import { BarAndLineAxis } from '@/api/asset_interfaces/metric';

type BarChartData = ReturnType<typeof generateBarChartData>;

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
    } satisfies Record<keyof BarChartData, IColumnLabelFormat>
  },
  render: (args) => {
    return (
      <div className="h-[90vh] w-[80vw]">
        <BusterChart {...args} />
      </div>
    );
  }
};

export const MultipleYAxis: Story = {
  args: {
    selectedChartType: ChartType.Bar,
    data: generateBarChartData(),
    barAndLineAxis: {
      x: ['category'],
      y: ['sales', 'units'],
      category: []
    } satisfies BarAndLineAxis,
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
    y2AxisShowAxisLabel: true,
    y2AxisShowAxisTitle: true,
    y2AxisAxisTitle: 'Returns'
  },
  render: (args) => {
    return (
      <div className="h-[90vh] w-[80vw]">
        <BusterChart {...args} />
      </div>
    );
  }
};

export const WithCategory: Story = {
  args: {
    selectedChartType: ChartType.Bar,
    data: Array.from({ length: 4 }, () => ({
      region: faker.location.state(),
      product: faker.commerce.productName(),
      sales: faker.number.int({ min: 1000, max: 10000 }),
      units: faker.number.int({ min: 50, max: 500 })
    })),
    barAndLineAxis: {
      x: ['region'],
      y: ['sales', 'units'],
      category: ['product']
    },
    columnLabelFormats: {
      region: {
        columnType: 'text',
        style: 'string'
      } satisfies IColumnLabelFormat,
      product: {
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
      } satisfies IColumnLabelFormat
    }
  },
  render: (args) => {
    return (
      <div className="h-[90vh] w-[80vw]">
        <BusterChart {...args} />
      </div>
    );
  }
};

export const DateXAxis: Story = {
  args: {
    selectedChartType: ChartType.Bar,
    data: Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - index);
      return {
        date: date.toISOString(),
        sales: faker.number.int({ min: 1000, max: 10000 }),
        units: faker.number.int({ min: 50, max: 500 })
      };
    }),
    barAndLineAxis: {
      x: ['date'],
      y: ['sales', 'units'],
      category: []
    },
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        dateFormat: 'LL'
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
      } satisfies IColumnLabelFormat
    },
    xAxisTimeInterval: 'day'
  },
  render: (args) => {
    return (
      <div className="h-[90vh] w-[80vw]">
        <BusterChart {...args} />
      </div>
    );
  }
};

export const HorizontalBar: Story = {
  args: {
    selectedChartType: ChartType.Bar,
    data: generateBarChartData(4),
    barAndLineAxis: {
      x: ['category'],
      y: ['sales'],
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
    barLayout: 'horizontal'
  },
  render: (args) => {
    return (
      <div className="h-[90vh] w-[80vw]">
        <BusterChart {...args} />
      </div>
    );
  }
};

export const WithDataLabels: Story = {
  args: {
    selectedChartType: ChartType.Bar,
    data: generateBarChartData(4),
    barAndLineAxis: {
      x: ['category'],
      y: ['sales', 'units'],
      category: []
    },
    columnSettings: {
      sales: {
        showDataLabels: true,
        showDataLabelsAsPercentage: false
      },
      units: {
        showDataLabels: false,
        showDataLabelsAsPercentage: false
      }
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
    } satisfies Record<keyof BarChartData, IColumnLabelFormat>
  },
  render: (args) => {
    return (
      <div className="h-[90vh] w-[80vw]">
        <BusterChart {...args} />
      </div>
    );
  }
};

export const LargeDataset: Story = {
  args: {
    selectedChartType: ChartType.Bar,
    data: Array.from({ length: 25 }, (_, index) => ({
      category: faker.commerce.productName(),
      sales: faker.number.int({ min: 5000, max: 50000 }),
      units: faker.number.int({ min: 100, max: 1000 }),
      returns: faker.number.int({ min: 100, max: 1000 })
    })),
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
    }
  },
  render: (args) => {
    return (
      <div className="h-[90vh] w-[80vw]">
        <BusterChart {...args} />
      </div>
    );
  }
};

export const LargeDatasetWithDualYAxis: Story = {
  args: {
    selectedChartType: ChartType.Combo,
    data: Array.from({ length: 25 }, (_, index) => ({
      category: faker.commerce.productName(),
      sales: faker.number.int({ min: 5000, max: 50000 }),
      units: faker.number.int({ min: 100, max: 1000 }),
      returns: faker.number.int({ min: 100, max: 1000 })
    })),
    comboChartAxis: {
      x: ['category'],
      y: ['sales', 'returns'],
      y2: ['units'],
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
    }
  },
  render: (args) => {
    return (
      <div className="h-[90vh] w-[80vw]">
        <BusterChart {...args} />
      </div>
    );
  }
};
