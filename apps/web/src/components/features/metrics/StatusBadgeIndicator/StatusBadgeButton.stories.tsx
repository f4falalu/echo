import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { VerificationStatusSchema } from '@buster/server-shared/share';
import { StatusBadgeButton } from './StatusBadgeButton';

const meta = {
  title: 'Features/Metrics/StatusBadgeButton',
  component: StatusBadgeButton,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  args: {
    status: 'notRequested',
    id: 'metric-123',
    isAdmin: false,
    onVerify: fn(),
    disabled: false
  },
  argTypes: {
    status: {
      control: 'select',
      options: Object.values(VerificationStatusSchema.enum),
      description: 'The verification status of the badge'
    },
    id: {
      control: 'text',
      description: 'The ID of the metric or an array of metric IDs'
    },
    isAdmin: {
      control: 'boolean',
      description: 'Whether the user is an admin and can change all statuses',
      defaultValue: false
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
      defaultValue: false
    },
    onVerify: {
      description: 'Function called when verification status is changed'
    }
  },
  decorators: [
    (Story) => (
      <div className="p-5">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof StatusBadgeButton>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic StatusBadgeButton examples for each status
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

// Admin user can change all statuses
export const AdminUser: Story = {
  args: {
    status: 'notRequested',
    isAdmin: true
  }
};

// Disabled button
export const DisabledButton: Story = {
  args: {
    status: 'notRequested',
    disabled: true
  }
};

// Multiple IDs (shows "Status" text)
export const MultipleIds: Story = {
  args: {
    status: 'notRequested',
    id: ['metric-123', 'metric-456', 'metric-789']
  }
};

// Verified status (non-admin can't change)
export const VerifiedNonAdmin: Story = {
  args: {
    status: 'verified',
    isAdmin: false
  }
};

// Admin with verified status (can change)
export const VerifiedAdmin: Story = {
  args: {
    status: 'verified',
    isAdmin: true
  }
};
