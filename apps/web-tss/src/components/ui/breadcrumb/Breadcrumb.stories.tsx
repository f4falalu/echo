import type { Meta, StoryObj } from '@storybook/react-vite';
import { Breadcrumb } from './Breadcrumb';

const meta: Meta<typeof Breadcrumb> = {
  title: 'UI/Breadcrumb',
  component: Breadcrumb,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof Breadcrumb>;

export const Default: Story = {
  args: {
    items: [
      { label: 'Home', route: { to: '/app/home' } },
      { label: 'Datasets', route: { to: '/app/datasets' } },
      { label: 'Current Dataset' },
    ],
  },
};

export const WithDropdown: Story = {
  args: {
    items: [
      { label: 'Home', route: { to: '/app/home' } },
      {
        label: null,
        dropdown: [
          { label: 'Dataset A', route: { to: '/app/datasets' } },
          { label: 'Dataset B', route: { to: '/app/datasets' } },
          { label: 'Dataset C', route: { to: '/app/datasets' } },
        ],
      },
      { label: 'Current Dataset' },
    ],
  },
};

export const CustomActiveIndex: Story = {
  args: {
    items: [
      { label: 'Home', route: { to: '/app/home' } },
      { label: 'Datasets', route: { to: '/app/datasets' } },
      { label: 'Settings', route: { to: '/app/chats/$chatId' } },
      { label: 'Profile' },
    ],
    activeIndex: 2,
  },
};

export const SingleItem: Story = {
  args: {
    items: [{ label: 'Home' }],
  },
};
