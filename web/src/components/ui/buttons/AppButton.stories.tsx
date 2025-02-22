import type { Meta, StoryObj } from '@storybook/react';
import { AppButton } from './AppButton';

const meta: Meta<typeof AppButton> = {
  title: 'Base/AppButton',
  component: AppButton,
  tags: ['autodocs'],
  args: {
    children: 'Button'
  }
};

export default meta;
type Story = StoryObj<typeof AppButton>;

export const Default: Story = {
  args: {
    variant: 'default',
    size: 'default'
  }
};

export const Black: Story = {
  args: {
    variant: 'black',
    size: 'default'
  }
};

export const Primary: Story = {
  args: {
    variant: 'primary',
    size: 'default'
  }
};

export const Tall: Story = {
  args: {
    variant: 'default',
    size: 'tall'
  }
};

export const Disabled: Story = {
  args: {
    variant: 'default',
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
