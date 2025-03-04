import type { Meta, StoryObj } from '@storybook/react';
import { PolicyCheck } from './PolicyCheck';
import { fn } from '@storybook/test';

const meta = {
  title: 'Features/Auth/PolicyCheck',
  component: PolicyCheck,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    password: { control: 'text' },
    show: { control: 'boolean' },
    placement: {
      control: 'select',
      options: ['top', 'right', 'bottom', 'left']
    },
    onCheckChange: { action: 'onCheckChange' }
  }
} satisfies Meta<typeof PolicyCheck>;

export default meta;
type Story = StoryObj<typeof PolicyCheck>;

export const Default: Story = {
  args: {
    password: '',
    show: true,
    placement: 'left',
    onCheckChange: fn()
  }
};

export const ValidPassword: Story = {
  args: {
    password: 'Test123!@#',
    show: true,
    placement: 'left',
    onCheckChange: fn()
  }
};

export const InvalidPassword: Story = {
  args: {
    password: 'weak',
    show: true,
    placement: 'left',
    onCheckChange: fn()
  }
};

export const Hidden: Story = {
  args: {
    password: 'Test123!@#',
    show: false,
    placement: 'left',
    onCheckChange: fn()
  }
};

export const DifferentPlacement: Story = {
  args: {
    password: 'Test123!@#',
    show: true,
    placement: 'right',
    onCheckChange: fn()
  }
};

export const WithCustomChildren: Story = {
  args: {
    password: 'Test123!@#',
    show: true,
    placement: 'left',
    onCheckChange: fn(),
    children: <span className="text-blue-500">Custom trigger element</span>
  }
};
