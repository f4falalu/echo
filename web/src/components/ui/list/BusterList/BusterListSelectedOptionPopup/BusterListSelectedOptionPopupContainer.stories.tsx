import type { Meta, StoryObj } from '@storybook/react';
import { BusterListSelectedOptionPopupContainer } from './BusterListSelectedOptionPopupContainer';
import React from 'react';
import { AppMaterialIcons } from '@/components/ui';
import { cn } from '@/lib/classMerge';

const meta: Meta<typeof BusterListSelectedOptionPopupContainer> = {
  title: 'UI/List/ListSelectedOptionPopup',
  component: BusterListSelectedOptionPopupContainer,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered'
  },
  argTypes: {
    selectedRowKeys: { control: 'object' },
    onSelectChange: { action: 'onSelectChange' },
    buttons: { control: 'object' },
    show: { control: 'boolean' }
  },
  decorators: [
    (Story) => (
      <div className="bg-background relative h-[200px] w-full min-w-[500px]">
        <Story />
      </div>
    )
  ]
};

export default meta;

type Story = StoryObj<typeof BusterListSelectedOptionPopupContainer>;

// Sample data
const sampleSelectedRowKeys = ['1', '2', '3'];

// Custom button component for the stories
const CustomButton: React.FC<{
  icon: 'delete' | 'edit' | 'add' | 'visibility';
  label: string;
  onClick: () => void;
}> = ({ icon, label, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex cursor-pointer items-center space-x-1 px-2 py-0.5',
        'bg-bg-container rounded-md',
        'border-border-default border border-dashed',
        'text-text-secondary hover:text-text-default transition-colors duration-200'
      )}>
      <AppMaterialIcons icon={icon} />
      <span>{label}</span>
    </div>
  );
};

export const Default: Story = {
  args: {
    selectedRowKeys: sampleSelectedRowKeys,
    onSelectChange: (keys) => console.log('Selection changed:', keys),
    show: true
  }
};

export const WithButtons: Story = {
  args: {
    selectedRowKeys: sampleSelectedRowKeys,
    onSelectChange: (keys) => console.log('Selection changed:', keys),
    buttons: [
      <CustomButton
        key="delete"
        icon="delete"
        label="Delete"
        onClick={() => alert('Delete clicked')}
      />,
      <CustomButton key="edit" icon="edit" label="Edit" onClick={() => alert('Edit clicked')} />
    ],
    show: true
  }
};

export const Hidden: Story = {
  args: {
    selectedRowKeys: [],
    onSelectChange: (keys) => console.log('Selection changed:', keys),
    show: false
  }
};

export const ForceShow: Story = {
  args: {
    selectedRowKeys: [],
    onSelectChange: (keys) => console.log('Selection changed:', keys),
    buttons: [
      <CustomButton key="add" icon="add" label="Add" onClick={() => alert('Add clicked')} />
    ],
    show: true
  },
  name: 'Force Show (Even With Empty Selection)'
};

export const SingleSelection: Story = {
  args: {
    selectedRowKeys: ['1'],
    onSelectChange: (keys) => console.log('Selection changed:', keys),
    buttons: [
      <CustomButton
        key="view"
        icon="visibility"
        label="View"
        onClick={() => alert('View clicked')}
      />,
      <CustomButton
        key="delete"
        icon="delete"
        label="Delete"
        onClick={() => alert('Delete clicked')}
      />
    ],
    show: true
  }
};
