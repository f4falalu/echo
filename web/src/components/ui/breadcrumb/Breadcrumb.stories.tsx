import type { Meta, StoryObj } from '@storybook/react';
import { Breadcrumb } from './Breadcrumb';
import { BusterAppRoutes } from '@/routes/busterRoutes/busterAppRoutes';

const meta: Meta<typeof Breadcrumb> = {
  title: 'UI/Breadcrumb',
  component: Breadcrumb,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered'
  }
};

export default meta;
type Story = StoryObj<typeof Breadcrumb>;

export const Default: Story = {
  args: {
    items: [
      { label: 'Home', route: { route: BusterAppRoutes.APP_ROOT } },
      { label: 'Datasets', route: { route: BusterAppRoutes.APP_DATASETS } },
      { label: 'Current Dataset' }
    ]
  }
};

export const WithDropdown: Story = {
  args: {
    items: [
      { label: 'Home', route: { route: BusterAppRoutes.APP_ROOT } },
      {
        label: null,
        dropdown: [
          { label: 'Dataset A', route: { route: BusterAppRoutes.APP_DATASETS } },
          { label: 'Dataset B', route: { route: BusterAppRoutes.APP_DATASETS } },
          { label: 'Dataset C', route: { route: BusterAppRoutes.APP_DATASETS } }
        ]
      },
      { label: 'Current Dataset' }
    ]
  }
};

export const CustomActiveIndex: Story = {
  args: {
    items: [
      { label: 'Home', route: { route: BusterAppRoutes.APP_ROOT } },
      { label: 'Datasets', route: { route: BusterAppRoutes.APP_DATASETS } },
      { label: 'Settings', route: { route: BusterAppRoutes.SETTINGS_GENERAL } },
      { label: 'Profile' }
    ],
    activeIndex: 2
  }
};

export const SingleItem: Story = {
  args: {
    items: [{ label: 'Home' }]
  }
};
