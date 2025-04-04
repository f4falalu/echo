import type { Meta, StoryObj } from '@storybook/react';
import { TanStackDataGrid } from './TanStackDataGrid';
import { faker } from '@faker-js/faker';
import { fn } from '@storybook/test';

const sampleData = Array.from({ length: 1000 }, (_, index) => ({
  id: index + 1,
  name: faker.person.fullName(),
  age: faker.number.int({ min: 18, max: 90 }),
  email: faker.internet.email(),
  joinDate: faker.date.past().toISOString()
}));

const meta: Meta<typeof TanStackDataGrid> = {
  title: 'UI/Table/TanStackDataGrid',
  component: TanStackDataGrid,
  parameters: {
    layout: 'fullscreen'
  },
  tags: ['autodocs'],
  args: {
    rows: sampleData,
    onReorderColumns: fn(),
    onResizeColumns: fn(),
    onReady: fn()
  },
  decorators: [
    (Story) => (
      <div className="h-[80vh] w-[90vw] p-0">
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof TanStackDataGrid>;

export const Default: Story = {
  args: {
    ...meta.args,
    rows: sampleData,
    resizable: true,
    sortable: true
  }
};

export const NonResizable: Story = {
  args: {
    ...meta.args,
    rows: sampleData,
    resizable: false,
    sortable: true
  }
};

export const NonDraggable: Story = {
  args: {
    ...meta.args,
    rows: sampleData,
    resizable: true,
    sortable: false
  }
};

export const CustomColumnOrder: Story = {
  args: {
    ...meta.args,
    rows: sampleData,
    columnOrder: ['name', 'email', 'age', 'id', 'joinDate'],
    resizable: true,

    sortable: true
  }
};

export const CustomColumnWidths: Story = {
  args: {
    ...meta.args,
    rows: sampleData,
    columnWidths: {
      id: 70,
      name: 180,
      age: 80,
      email: 220,
      joinDate: 120
    },
    resizable: true,

    sortable: true
  }
};

export const CustomFormatting: Story = {
  args: {
    ...meta.args,
    rows: sampleData,
    headerFormat: (value, columnName) => columnName.toUpperCase(),
    cellFormat: (value, columnName) => {
      if (columnName === 'joinDate' && value instanceof Date) {
        return value.toLocaleDateString();
      }
      if (columnName === 'age') {
        return `${value} years`;
      }
      return String(value);
    },
    resizable: true,

    sortable: true
  }
};

export const WithCallbacks: Story = {
  args: {
    ...meta.args,
    rows: sampleData,
    onReorderColumns: (columnIds) => console.log('Columns reordered:', columnIds),
    onResizeColumns: (columnSizes) => console.log('Columns resized:', columnSizes),
    onReady: () => console.log('Grid is ready'),
    resizable: true,

    sortable: true
  }
};

export const TenThousandRows: Story = {
  args: {
    ...meta.args,
    rows: Array.from({ length: 10000 }).map((_, index) => ({
      id: index + 1,
      name: `User ${index + 1}`,
      age: Math.floor(Math.random() * 50) + 18,
      email: `user${index + 1}@example.com`,
      joinDate: new Date(
        2023,
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28) + 1
      ).toISOString()
    })),
    resizable: true,

    sortable: true
  }
};
