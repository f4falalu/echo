import type { Meta, StoryObj } from '@storybook/react';
import { Segmented } from './Segmented';
import { HouseModern } from '../icons';

const meta: Meta<typeof Segmented> = {
  title: 'Base/Segmented',
  component: Segmented,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'radio',
      options: ['default', 'large']
    },
    block: {
      control: 'boolean'
    },
    value: {
      control: 'text'
    },
    type: {
      control: 'radio',
      options: ['button', 'track']
    }
  },
  render: (args) => {
    return (
      <div className="flex w-full min-w-[500px] flex-col items-center justify-center gap-4">
        <Segmented {...args} />
      </div>
    );
  }
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

export const Large: Story = {
  args: {
    items: defaultItems,
    size: 'large'
  }
};

export const Block: Story = {
  args: {
    items: defaultItems,
    block: true
  },
  parameters: {
    layout: 'padded'
  }
};

export const LargeBlock: Story = {
  args: {
    items: defaultItems,
    size: 'large',
    block: true
  },
  parameters: {
    layout: 'padded'
  }
};

export const WithIcons: Story = {
  args: {
    items: [
      { value: 'list', label: 'List' },
      { value: 'grid', label: 'Grid' },
      { value: 'gallery', label: 'Gallery' }
    ]
  }
};

export const Controlled: Story = {
  args: {
    items: defaultItems,
    value: 'tab2'
  }
};

export const WithDisabledItems: Story = {
  args: {
    items: [
      { value: 'tab1', label: 'Enabled' },
      { value: 'tab2', label: 'Disabled', disabled: true },
      { value: 'tab3', label: 'Enabled' }
    ]
  }
};

export const CustomStyling: Story = {
  args: {
    items: defaultItems,
    className: 'bg-blue-100 [&_[data-state=active]]:text-blue-700'
  }
};
