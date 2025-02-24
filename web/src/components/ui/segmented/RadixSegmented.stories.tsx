import type { Meta, StoryObj } from '@storybook/react';
import { RadixSegmented } from './RadixSegmented';

const meta: Meta<typeof RadixSegmented> = {
  title: 'UI/RadixSegmented',
  component: RadixSegmented,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof RadixSegmented>;

const defaultItems = [
  { value: 'tab1', label: 'Tab 1' },
  { value: 'tab2', label: 'Tab 2' },
  { value: 'tab3', label: 'Tab 3' }
];

export const Default: Story = {
  args: {
    items: defaultItems
  }
};

export const WithIcons: Story = {
  args: {
    items: [
      { value: 'list', label: '📋 List' },
      { value: 'grid', label: '📱 Grid' },
      { value: 'gallery', label: '🖼️ Gallery' }
    ]
  }
};

export const Controlled: Story = {
  args: {
    items: defaultItems,
    value: 'tab2'
  }
};

export const CustomStyling: Story = {
  args: {
    items: defaultItems,
    className: 'bg-blue-100 [&_[data-state=active]]:text-blue-700'
  }
};
