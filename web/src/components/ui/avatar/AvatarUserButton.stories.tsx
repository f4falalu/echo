import type { Meta, StoryObj } from '@storybook/react';
import { AvatarUserButton } from './AvatarUserButton';

const defaultUser = {
  username: 'John Doe',
  avatarUrl: 'https://i.pravatar.cc/200',
  email: 'john.doe@example.com'
};

const meta: Meta<typeof AvatarUserButton> = {
  title: 'UI/Avatar/AvatarUserButton',
  component: AvatarUserButton,
  parameters: {
    layout: 'fullscreen'
  },
  decorators: [
    (Story) => (
      <div className="bg-background-secondary h-screen w-[300px] p-4">
        <Story />
      </div>
    )
  ],
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof AvatarUserButton>;

export const Default: Story = {
  args: {
    ...defaultUser
  }
};

export const WithCustomUser: Story = {
  args: {
    ...defaultUser
  }
};

export const WithOnlyUsername: Story = {
  args: {
    ...defaultUser,
    avatarUrl: undefined
  }
};

export const WithClickHandler: Story = {
  args: {
    username: 'Click Me',
    onClick: () => alert('User component clicked!')
  }
};
