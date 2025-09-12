import type { Meta, StoryObj } from '@storybook/react-vite';
import { Breadcrumb } from './Breadcrumb';
import { createBreadcrumbItem } from './create-breadcrumb';

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
      { label: 'Home', link: { to: '/app/home' } },
      { label: 'Datasets', link: { to: '/app/datasets' } },
      { label: 'Current Dataset' },
    ],
  },
};

export const WithDropdown: Story = {
  args: {
    items: [
      { label: 'Home', link: { to: '/app/home' } },
      {
        label: null,
        dropdown: [
          { label: 'Dataset A', link: { to: '/app/datasets' } },
          { label: 'Dataset B', link: { to: '/app/datasets' } },
          { label: 'Dataset C', link: { to: '/app/datasets' } },
        ],
      },
      { label: 'Current Dataset' },
    ],
  },
};

export const CustomActiveIndex: Story = {
  args: {
    items: [
      { label: 'Home', link: { to: '/app/home' } },
      { label: 'Datasets', link: { to: '/app/datasets' } },
      createBreadcrumbItem({
        label: 'Settings',
        link: { to: '/app/chats/$chatId', params: { chatId: '123' } },
      }),
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
