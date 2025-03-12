import type { Meta, StoryObj } from '@storybook/react';
import { AppDataGrid } from './AppDataGrid';

const meta: Meta<typeof AppDataGrid> = {
  title: 'UI/table/AppDataGrid',
  component: AppDataGrid,
  parameters: {
    layout: 'fullscreen'
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof AppDataGrid>;

const sampleData = [
  { id: 1, name: 'John Doe', age: 30, email: 'john@example.com', joinDate: new Date('2023-01-15') },
  {
    id: 2,
    name: 'Jane Smith',
    age: 25,
    email: 'jane@example.com',
    joinDate: new Date('2023-02-20')
  },
  {
    id: 3,
    name: 'Bob Johnson',
    age: 35,
    email: 'bob@example.com',
    joinDate: new Date('2023-03-10')
  },
  {
    id: 4,
    name: 'Alice Brown',
    age: 28,
    email: 'alice@example.com',
    joinDate: new Date('2023-04-05')
  }
];

export const Default: Story = {
  args: {
    rows: sampleData,
    animate: true,
    resizable: true,
    draggable: true,
    sortable: true
  }
};

export const NonResizable: Story = {
  args: {
    rows: sampleData,
    resizable: false,
    draggable: true,
    sortable: true
  }
};

export const NonDraggable: Story = {
  args: {
    rows: sampleData,
    resizable: true,
    draggable: false,
    sortable: true
  }
};

export const NonSortable: Story = {
  args: {
    rows: sampleData,
    resizable: true,
    draggable: true,
    sortable: false
  }
};

export const CustomColumnOrder: Story = {
  args: {
    rows: sampleData,
    columnOrder: ['name', 'email', 'age', 'id', 'joinDate'],
    resizable: true,
    draggable: true,
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
      return String(value);
    },
    resizable: true,
    draggable: true,
    sortable: true
  }
};

export const WithInitialWidth: Story = {
  args: {
    rows: sampleData,
    initialWidth: 800,
    resizable: true,
    draggable: true,
    sortable: true
  }
};
