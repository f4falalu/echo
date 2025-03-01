import type { Meta, StoryObj } from '@storybook/react';
import { BusterList } from './index';
import { BusterListProps, BusterListRow } from './interfaces';
import React from 'react';
import { faker } from '@faker-js/faker';

const meta: Meta<typeof BusterList> = {
  title: 'UI/List/BusterList',
  component: BusterList,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered'
  },
  argTypes: {
    columns: { control: 'object' },
    rows: { control: 'object' },
    selectedRowKeys: { control: 'object' },
    showHeader: { control: 'boolean' },
    showSelectAll: { control: 'boolean' },
    useRowClickSelectChange: { control: 'boolean' },
    rowClassName: { control: 'text' },
    hideLastRowBorder: { control: 'boolean' }
  }
};

export default meta;

type Story = StoryObj<typeof BusterList>;

// Sample data for the stories
const sampleColumns = [
  {
    dataIndex: 'name',
    title: 'Name',
    width: 200
  },
  {
    dataIndex: 'age',
    title: 'Age',
    width: 100
  },
  {
    dataIndex: 'address',
    title: 'Address',
    width: 300
  },
  {
    dataIndex: 'email',
    title: 'Email',
    width: 200
  },
  {
    dataIndex: 'actions',
    title: 'Actions',
    width: 100,
    render: (_: any, record: any) => <button className="text-blue-500 hover:underline">View</button>
  }
];

// Generate sample rows using faker
const generateSampleRows = (count: number): BusterListRow[] => {
  const rows: BusterListRow[] = [];

  // Generate regular rows
  for (let i = 0; i < count; i++) {
    rows.push({
      id: i.toString(),
      data: {
        name: faker.person.fullName(),
        age: faker.number.int({ min: 18, max: 80 }),
        address: `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state()}`,
        email: faker.internet.email()
      }
    });
  }

  // Add a section row in the middle
  const sectionIndex = Math.floor(count / 2);
  rows.splice(sectionIndex, 0, {
    id: 'section1',
    data: null,
    rowSection: {
      title: faker.company.name(),
      secondaryTitle: faker.company.catchPhrase()
    }
  });

  return rows;
};

// Generate sample rows
const sampleRows = generateSampleRows(5);

const sampleContextMenu = {
  items: [
    {
      key: 'view',
      label: 'View Details',
      onClick: (id: string) => alert(`View ${id}`)
    },
    {
      key: 'edit',
      label: 'Edit',
      onClick: (id: string) => alert(`Edit ${id}`)
    },
    {
      key: 'delete',
      label: 'Delete',
      danger: true,
      onClick: (id: string) => alert(`Delete ${id}`)
    }
  ]
};

export const Default: Story = {
  args: {
    columns: sampleColumns,
    rows: sampleRows,
    showHeader: true,
    showSelectAll: true
  },
  render: (args) => (
    <div style={{ height: '400px', width: '800px' }}>
      <BusterList {...args} />
    </div>
  )
};

export const WithSelection: Story = {
  args: {
    columns: sampleColumns,
    rows: sampleRows,
    selectedRowKeys: [sampleRows[0].id, sampleRows[2].id],
    showHeader: true,
    showSelectAll: true,
    onSelectChange: (selectedRowKeys) => alert(`Selected ${selectedRowKeys.join(', ')}`)
  },
  render: (args) => (
    <div style={{ height: '400px', width: '800px' }}>
      <BusterList {...args} />
    </div>
  )
};

export const WithContextMenu: Story = {
  args: {
    columns: sampleColumns,
    rows: sampleRows,
    contextMenu: sampleContextMenu,
    showHeader: true,
    showSelectAll: true
  },
  render: (args) => (
    <div style={{ height: '400px', width: '800px' }}>
      <BusterList {...args} />
    </div>
  )
};

export const WithRowClickSelection: Story = {
  args: {
    columns: sampleColumns,
    rows: sampleRows,
    useRowClickSelectChange: true,
    showHeader: true,
    showSelectAll: true,
    onSelectChange: (selectedRowKeys) => alert(`Selected ${selectedRowKeys.join(', ')}`)
  },
  render: (args) => (
    <div style={{ height: '400px', width: '800px' }}>
      <BusterList {...args} />
    </div>
  )
};

export const WithoutHeader: Story = {
  args: {
    columns: sampleColumns,
    rows: sampleRows,
    showHeader: false
  },
  render: (args) => (
    <div style={{ height: '400px', width: '800px' }}>
      <BusterList {...args} />
    </div>
  )
};

export const EmptyState: Story = {
  args: {
    columns: sampleColumns,
    rows: [],
    emptyState: <div className="text-gray-500">No data available</div>,
    showHeader: true
  },
  render: (args) => (
    <div style={{ height: '400px', width: '800px' }}>
      <BusterList {...args} />
    </div>
  )
};

export const BorderVariant: Story = {
  args: {
    columns: sampleColumns,
    rows: generateSampleRows(30),
    hideLastRowBorder: true,
    showHeader: true,
    showSelectAll: true,
    onSelectChange: (selectedRowKeys) => alert(`Selected ${selectedRowKeys.join(', ')}`),
    selectedRowKeys: generateSampleRows(30)
      .filter((_, index) => index % 3 === 0)
      .map((row) => row.id)
  },
  render: (args) => (
    <div className="flex flex-col gap-4" style={{ height: '900px', width: '800px' }}>
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-medium">Border Variant with Many Rows</h3>
        <p className="text-sm text-gray-500">
          This variant remove the border of the last row. This is useful when you want to put this
          list inside of a container that already contains a border
        </p>
        <div className="min-h-[300px]">
          <BusterList {...args} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-medium">Default Variant with Many Rows</h3>
        <p className="text-sm text-gray-500">This variant shows rows without container styling.</p>
        <div className="min-h-[300px]">
          <BusterList {...args} hideLastRowBorder={false} />
        </div>
      </div>
    </div>
  )
};

// Story with many rows to demonstrate virtualization
export const ManyRows: Story = {
  args: {
    columns: sampleColumns,
    rows: generateSampleRows(100),
    showHeader: true,
    showSelectAll: true
  },
  render: (args) => (
    <div style={{ height: '400px', width: '800px' }}>
      <BusterList {...args} />
    </div>
  )
};
