import type { Meta, StoryObj } from '@storybook/react';
import { AppDataGrid2 } from './AppDataGrid2';

const meta: Meta<typeof AppDataGrid2> = {
  title: 'UI/Table/AppDataGrid2',
  component: AppDataGrid2,
  parameters: {
    layout: 'fullscreen'
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof AppDataGrid2>;

const sampleData = [
  {
    id: 1,
    name: 'John Doe',
    age: 30,
    email: 'john@example.com',
    joinDate: new Date('2023-01-15').toISOString()
  },
  {
    id: 2,
    name: 'Jane Smith',
    age: 25,
    email: 'jane@example.com',
    joinDate: new Date('2023-02-20').toISOString()
  },
  {
    id: 3,
    name: 'Bob Johnson',
    age: 35,
    email: 'bob@example.com',
    joinDate: new Date('2023-03-10').toISOString()
  },
  {
    id: 4,
    name: 'Alice Brown',
    age: 28,
    email: 'alice@example.com',
    joinDate: new Date('2023-04-05').toISOString()
  },
  {
    id: 5,
    name: 'Michael Wilson',
    age: 42,
    email: 'michael@example.com',
    joinDate: new Date('2023-05-12').toISOString()
  },
  {
    id: 6,
    name: 'Sarah Davis',
    age: 31,
    email: 'sarah@example.com',
    joinDate: new Date('2023-06-08').toISOString()
  }
];

export const Default: Story = {
  args: {
    rows: sampleData,
    resizable: true,

    sortable: true
  },
  render: (args) => (
    <div className="h-[500px] overflow-y-auto border p-3">
      <AppDataGrid2 {...args} />
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
