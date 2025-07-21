import type { Meta, StoryObj } from '@storybook/react';
import { WorkspaceAvatar } from './WorkspaceAvatar';

const meta: Meta<typeof WorkspaceAvatar> = {
  title: 'Features/WorkspaceAvatar',
  component: WorkspaceAvatar,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply to the avatar container'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {}
};
