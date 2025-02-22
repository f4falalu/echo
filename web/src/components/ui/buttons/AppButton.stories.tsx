import type { Meta, StoryObj } from '@storybook/react';
import { AppButton } from './AppButton';

const meta: Meta<typeof AppButton> = {
  title: 'Base/AppButton',
  component: AppButton,
  tags: ['autodocs'],
  args: {
    children: 'Button'
  },
  argTypes: {
    buttonType: {
      control: 'select',
      options: ['default', 'black', 'primary']
    },
    size: {
      control: 'select',
      options: ['default', 'tall']
    },
    disabled: {
      control: 'boolean',
      defaultValue: false
    },
    loading: {
      control: 'boolean',
      defaultValue: false
    }
  }
};

export default meta;
type Story = StoryObj<typeof AppButton>;

export const Default: Story = {
  args: {
    buttonType: 'default',
    size: 'default'
  }
};

export const Black: Story = {
  args: {
    buttonType: 'black',
    size: 'default'
  }
};

export const Primary: Story = {
  args: {
    buttonType: 'primary',
    size: 'default'
  }
};

export const Tall: Story = {
  args: {
    buttonType: 'default',
    size: 'tall'
  }
};

export const Disabled: Story = {
  args: {
    buttonType: 'default',
    size: 'default',
    disabled: true
  }
};

export const AsChild: Story = {
  args: {
    asChild: true,
    children: <a href="/">Link Button</a>
  }
};

export const Loading: Story = {
  args: {
    buttonType: 'default',
    size: 'default',
    loading: true
  }
};
