import type { Meta, StoryObj } from '@storybook/react';
import { TanStackDataGrid } from './TanStackDataGrid';
import { faker } from '@faker-js/faker';

const meta: Meta<typeof TanStackDataGrid> = {
  title: 'UI/Table/TanStackDataGrid',
  component: TanStackDataGrid,
  parameters: {
    layout: 'fullscreen'
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof TanStackDataGrid>;

const sampleData = Array.from({ length: 1000 }, (_, index) => ({
  id: index + 1,
  name: faker.person.fullName(),
  age: faker.number.int({ min: 18, max: 90 }),
  email: faker.internet.email(),
  joinDate: faker.date.past().toISOString()
}));

export const Default: Story = {
  args: {
    rows: sampleData,
    resizable: true,

    sortable: true
  },
  render: (args) => (
    <div className="h-[500px] p-0">
      <TanStackDataGrid {...args} />
    </div>
  )
};

export const NonResizable: Story = {
  args: {
    rows: sampleData,
    resizable: false,

    sortable: true
  }
};

export const NonDraggable: Story = {
  args: {
    rows: sampleData,
    resizable: true,
    sortable: false
  }
};

export const NonSortable: Story = {
  args: {
    rows: sampleData,
    resizable: true,

    sortable: false
  }
};

export const CustomColumnOrder: Story = {
  args: {
    rows: sampleData,
    columnOrder: ['name', 'email', 'age', 'id', 'joinDate'],
    resizable: true,

    sortable: true
  }
};

export const CustomColumnWidths: Story = {
  args: {
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
    rows: sampleData,
    onReorderColumns: (columnIds) => console.log('Columns reordered:', columnIds),
    onResizeColumns: (columnSizes) => console.log('Columns resized:', columnSizes),
    onReady: () => console.log('Grid is ready'),
    resizable: true,

    sortable: true
  }
};

export const ManyRows: Story = {
  args: {
    rows: Array.from({ length: 1000 }).map((_, index) => ({
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
