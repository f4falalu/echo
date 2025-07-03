import type { Meta, StoryObj } from '@storybook/react';
import { VerificationStatus } from '@/api/asset_interfaces';
import { StatusBadgeIndicator } from './StatusBadgeIndicator';

const meta = {
  title: 'Features/Metrics/StatusBadgeIndicator',
  component: StatusBadgeIndicator,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  args: {
    status: 'notRequested',
    size: 16,
    showTooltip: true
  },
  argTypes: {
    status: {
      control: 'select',
      options: Object.values(VerificationStatus),
      description: 'The verification status of the badge'
    },
    size: {
      control: { type: 'number' },
      description: 'The size of the badge in pixels',
      defaultValue: 16
    },
    showTooltip: {
      control: 'boolean',
      description: 'Whether to show a tooltip on hover',
      defaultValue: true
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply to the badge'
    }
  }
} satisfies Meta<typeof StatusBadgeIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic StatusBadgeIndicator examples for each status
export const NotRequested: Story = {
  args: {
    status: 'notRequested'
  }
};

export const Requested: Story = {
  args: {
    status: 'requested'
  }
};

export const InReview: Story = {
  args: {
    status: 'inReview'
  }
};

export const Verified: Story = {
  args: {
    status: 'verified'
  }
};

export const Backlogged: Story = {
  args: {
    status: 'backlogged'
  }
};

export const NotVerified: Story = {
  args: {
    status: 'notVerified'
  }
};

// Size variations
export const LargeSize: Story = {
  args: {
    status: 'verified',
    size: 24
  }
};

export const SmallSize: Story = {
  args: {
    status: 'verified',
    size: 12
  }
};

// Without tooltip
export const WithoutTooltip: Story = {
  args: {
    status: 'verified',
    showTooltip: false
  }
};
