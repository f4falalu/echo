import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './Avatar';

const meta = {
  title: 'Base/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
  args: {
    name: 'John Doe'
  }
};

export const WithImage: Story = {
  args: {
    name: 'John Doe',
    image: 'https://github.com/shadcn.png'
  }
};

export const WithTooltip: Story = {
  args: {
    name: 'John Doe',
    useToolTip: true
  }
};

export const CustomClassName: Story = {
  args: {
    name: 'John Doe',
    className: 'h-12 w-12'
  }
};

export const SingleLetter: Story = {
  args: {
    name: 'John'
  }
};

export const NoName: Story = {
  args: {}
};
