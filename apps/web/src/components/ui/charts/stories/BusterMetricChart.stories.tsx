import type { Meta, StoryObj } from '@storybook/react';
import { DEFAULT_COLUMN_LABEL_FORMAT, type ColumnLabelFormat } from '@buster/server-shared/metrics';
import { BusterMetricChart } from '../MetricChart/BusterMetricChart';

const meta: Meta<typeof BusterMetricChart> = {
  title: 'UI/Charts/BusterChart/BusterMetricChart',
  component: BusterMetricChart,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof BusterMetricChart>;

export default meta;
type Story = StoryObj<typeof BusterMetricChart>;

export const Basic: Story = {
  args: {
    data: [{ value: 1234, category: 'Sales' }],
    metricColumnId: 'value',
    columnLabelFormats: {
      value: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number',
        style: 'number',
        numberSeparatorStyle: ','
      } as ColumnLabelFormat,
      category: {
        columnType: 'text',
        style: 'string'
      } as ColumnLabelFormat
    },
    metricHeader: 'Total Count',
    animate: true
  },
  render: (args) => (
    <div className="h-[200px] w-[300px] rounded-md border border-slate-200 p-4">
      <BusterMetricChart {...args} />
    </div>
  )
};

export const WithCurrency: Story = {
  args: {
    data: [{ revenue: 5250.75, month: 'January' }],
    metricColumnId: 'revenue',
    columnLabelFormats: {
      revenue: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      } as ColumnLabelFormat,
      month: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'text',
        style: 'string'
      } as ColumnLabelFormat
    },
    metricHeader: 'Monthly Revenue',
    metricSubHeader: 'January 2024',
    animate: true
  },
  render: (args) => (
    <div className="h-[200px] w-[300px] rounded-md border border-slate-200 p-4">
      <BusterMetricChart {...args} />
    </div>
  )
};

export const WithAggregate: Story = {
  args: {
    data: [
      { sales: 1200, region: 'North' },
      { sales: 1500, region: 'South' },
      { sales: 2300, region: 'East' },
      { sales: 1800, region: 'West' }
    ],
    metricColumnId: 'sales',
    metricValueAggregate: 'sum',
    columnLabelFormats: {
      sales: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number',
        style: 'currency',
        currency: 'USD'
      } as ColumnLabelFormat,
      region: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'text',
        style: 'string'
      } as ColumnLabelFormat
    },
    metricHeader: 'Total Sales',
    metricSubHeader: 'All Regions',
    animate: true
  },
  render: (args) => (
    <div className="h-[200px] w-[300px] rounded-md border border-slate-200 p-4">
      <BusterMetricChart {...args} />
    </div>
  )
};

export const WithDynamicHeaders: Story = {
  args: {
    data: [{ count: 42, category: 'Active Users', date: '2024-03-15' }],
    metricColumnId: 'count',
    metricHeader: { columnId: 'category', useValue: true, aggregate: 'sum' },
    metricSubHeader: { columnId: 'date', useValue: true, aggregate: 'sum' },
    columnLabelFormats: {
      count: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number',
        style: 'number'
      } satisfies ColumnLabelFormat,
      category: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'text',
        style: 'string'
      } satisfies ColumnLabelFormat,
      date: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'date',
        style: 'date',
        dateFormat: 'LL'
      } satisfies ColumnLabelFormat
    },
    animate: true
  },
  render: (args) => (
    <div className="h-[200px] w-[300px] rounded-md border border-slate-200 p-4">
      <BusterMetricChart {...args} />
    </div>
  )
};

export const NoAnimation: Story = {
  args: {
    data: [{ value: 87.5, unit: 'Percent' }],
    metricColumnId: 'value',
    columnLabelFormats: {
      value: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number',
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      } as ColumnLabelFormat,
      unit: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'text',
        style: 'string'
      } satisfies ColumnLabelFormat
    },
    metricHeader: 'Completion Rate',
    animate: false
  },
  render: (args) => (
    <div className="h-[200px] w-[300px] rounded-md border border-slate-200 p-4">
      <BusterMetricChart {...args} />
    </div>
  )
};

export const CustomValueLabel: Story = {
  args: {
    data: [{ value: 1500, type: 'New Users' }],
    metricColumnId: 'value',
    metricValueLabel: '1.5K',
    columnLabelFormats: {
      value: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number',
        style: 'number'
      } as ColumnLabelFormat,
      type: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'text',
        style: 'string'
      } as ColumnLabelFormat
    },
    metricHeader: 'User Growth',
    metricSubHeader: 'Last Month',
    animate: true
  },
  render: (args) => (
    <div className="h-[200px] w-[300px] rounded-md border border-slate-200 p-4">
      <BusterMetricChart {...args} />
    </div>
  )
};
