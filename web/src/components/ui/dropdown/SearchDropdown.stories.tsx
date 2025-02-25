import type { Meta, StoryObj } from '@storybook/react';
import { SearchDropdown } from './SearchDropdown';
import { FiUser, FiSettings, FiMail } from 'react-icons/fi';
import { useState } from 'react';

const meta: Meta<typeof SearchDropdown> = {
  title: 'Base/SearchDropdown',
  component: SearchDropdown,
  parameters: {
    layout: 'centered'
  },
  argTypes: {
    open: {
      control: 'boolean',
      defaultValue: true
    }
  },
  tags: ['autodocs'],
  render: (args) => (
    <div className="flex min-w-[500px] flex-col gap-0">
      <SearchDropdown {...args} children={<div className="h-6 w-full bg-gray-300"></div>} />
    </div>
  )
};

export default meta;
type Story = StoryObj<typeof SearchDropdown>;

const items = [
  {
    label: 'Nate Rules',
    value: 'profile',
    icon: <FiUser />
  },
  {
    label: 'Settings',
    value: 'settings',
    icon: <FiSettings />
  },
  {
    label: 'Messages',
    value: 'messages',
    icon: <FiMail />,
    disabled: false
  }
];

// Basic example
export const Default: Story = {
  args: {
    items: items,
    open: true,
    onSelect: (item) => console.log('Selected:', item.value)
  }
};

// Example with some items disabled
export const WithDisabledItems: Story = {
  args: {
    items: [
      ...items,
      {
        label: 'Disabled Option',
        value: 'disabled',
        disabled: true
      }
    ],
    open: true,
    onSelect: (item) => console.log('Selected:', item)
  }
};

// Example with custom styling
export const CustomStyling: Story = {
  args: {
    items: items,
    open: true,
    className: 'bg-slate-100 rounded-lg shadow-lg',
    onSelect: (item) => console.log('Selected:', item)
  }
};
