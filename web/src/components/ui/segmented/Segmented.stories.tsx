import type { Meta, StoryObj } from '@storybook/react';
import { Segmented } from './Segmented';
import { HouseModern } from '../icons';

const meta: Meta<typeof Segmented> = {
  title: 'Base/Segmented',
  component: Segmented,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof Segmented>;

const defaultItems = [
  { value: 'tab1', label: 'Tab 1', icon: <HouseModern /> },
  { value: 'tab2', label: 'Tab 2', disabled: true, icon: <HouseModern /> },
  { value: 'tab3', label: 'Tab 3', icon: <HouseModern /> }
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
