import type { Meta, StoryObj } from '@storybook/react';
import { Pill } from './Pill';

const meta: Meta<typeof Pill> = {
  title: 'UI/pills/Pill',
  component: Pill,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['gray', 'danger', 'success'],
      description: 'The visual variant of the pill'
    },
    children: {
      control: { type: 'text' },
      description: 'The content of the pill'
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Gray: Story = {
  args: {
    variant: 'gray',
    children: 'Gray Pill'
  }
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Danger Pill'
  }
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Success Pill'
  }
};
