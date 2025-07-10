import type { Meta, StoryObj } from '@storybook/react';
import { SettingsCards } from './SettingsCard';
import { Button } from '@/components/ui/buttons';
import { Pill } from '@/components/ui/pills/Pill';
import { Text } from '@/components/ui/typography';

const meta: Meta<typeof SettingsCards> = {
  title: 'Features/SettingsCards',
  component: SettingsCards,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A security cards component that displays security-related information in structured card sections.'
      }
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof SettingsCards>;

// Mock data for different use cases
const basicSections = [
  <div className="flex items-center justify-between">
    <div>
      <Text className="font-medium">Two-Factor Authentication</Text>
      <Text variant="secondary" size="sm">
        Add an extra layer of security to your account
      </Text>
    </div>
    <Button size="small" variant="outlined">
      Enable
    </Button>
  </div>,
  <div className="flex items-center justify-between">
    <div>
      <Text className="font-medium">API Keys</Text>
      <Text variant="secondary" size="sm">
        Manage your API access tokens
      </Text>
    </div>
    <Button size="small" variant="outlined">
      Manage
    </Button>
  </div>,
  <div className="flex items-center justify-between">
    <div>
      <Text className="font-medium">Invite Links</Text>
      <Text variant="secondary" size="sm">
        Share your account with others
      </Text>
    </div>
    <Button size="small" variant="outlined">
      Manage
    </Button>
  </div>
];

const detailedSections = [
  <div className="flex items-center justify-between">
    <div>
      <div className="mb-1 flex items-center gap-2">
        <Text className="font-medium">Password Policy</Text>
        <Pill variant="success">Active</Pill>
      </div>
      <Text variant="secondary" size="sm">
        Minimum 8 characters with uppercase, lowercase, numbers, and symbols
      </Text>
    </div>
    <Button size="small">Update</Button>
  </div>,
  <div className="flex items-center justify-between">
    <div>
      <div className="mb-1 flex items-center gap-2">
        <Text className="font-medium">Session Timeout</Text>
        <Pill variant="gray">30 minutes</Pill>
      </div>
      <Text variant="secondary" size="sm">
        Automatic logout after period of inactivity
      </Text>
    </div>
    <Button size="small" variant="outlined">
      Configure
    </Button>
  </div>,
  <div className="flex items-center justify-between">
    <div>
      <Text className="font-medium">IP Restrictions</Text>
      <Text variant="secondary" size="sm">
        Limit access to specific IP addresses
      </Text>
    </div>
    <Button size="small" variant="ghost">
      Setup
    </Button>
  </div>
];

const accessLogSections = [
  <div>
    <div className="mb-2 flex items-center justify-between">
      <Text className="font-medium">Recent Login Activity</Text>
      <Text variant="secondary" size="sm">
        Last 7 days
      </Text>
    </div>
    <div className="space-y-2">
      <div className="flex items-center justify-between py-1">
        <div>
          <Text size="sm">Chrome on macOS</Text>
          <Text variant="secondary" size="xs">
            192.168.1.100 • 2 hours ago
          </Text>
        </div>
        <Pill variant="success">Current</Pill>
      </div>
      <div className="flex items-center justify-between py-1">
        <div>
          <Text size="sm">Safari on iPhone</Text>
          <Text variant="secondary" size="xs">
            10.0.1.50 • 1 day ago
          </Text>
        </div>
        <Button size="small" variant="ghost">
          Revoke
        </Button>
      </div>
    </div>
  </div>
];

export const Default: Story = {
  args: {
    title: 'Account Security',
    description: 'Manage your security settings and authentication methods',
    cards: [
      {
        sections: basicSections
      }
    ]
  }
};

export const MultipleCards: Story = {
  args: {
    title: 'Security Overview',
    description: 'Complete security configuration for your organization',
    cards: [
      {
        sections: detailedSections
      },
      {
        sections: accessLogSections
      }
    ]
  }
};

export const SingleSection: Story = {
  args: {
    title: 'Quick Setup',
    description: 'Essential security setting that needs immediate attention',
    cards: [
      {
        sections: [
          <div className="flex items-center justify-between">
            <div>
              <Text className="font-medium">Enable Two-Factor Authentication</Text>
              <Text variant="secondary" size="sm">
                Protect your account with an additional verification step
              </Text>
            </div>
            <Button>Get Started</Button>
          </div>
        ]
      }
    ]
  }
};

export const EmptyState: Story = {
  args: {
    title: 'Security Settings',
    description: 'No security configurations available',
    cards: []
  }
};

export const ComplexContent: Story = {
  args: {
    title: 'Advanced Security Configuration',
    description: 'Comprehensive security settings with detailed controls',
    cards: [
      {
        sections: [
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <Text className="font-medium">Organization Policies</Text>
                <Text variant="secondary" size="sm">
                  Configure security policies for all team members
                </Text>
              </div>
              <Button size="small">Manage</Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Text size="sm" className="font-medium">
                  Password Requirements
                </Text>
                <ul className="space-y-1">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <Text size="xs" variant="secondary">
                      Minimum 12 characters
                    </Text>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <Text size="xs" variant="secondary">
                      Special characters required
                    </Text>
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <Text size="sm" className="font-medium">
                  Access Controls
                </Text>
                <ul className="space-y-1">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    <Text size="xs" variant="secondary">
                      Role-based permissions
                    </Text>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    <Text size="xs" variant="secondary">
                      IP whitelisting enabled
                    </Text>
                  </li>
                </ul>
              </div>
            </div>
          </div>,
          <div className="flex items-center justify-between">
            <div>
              <Text className="font-medium">Audit Logging</Text>
              <Text variant="secondary" size="sm">
                Track all security-related events and user actions
              </Text>
            </div>
            <div className="flex items-center gap-2">
              <Pill variant="success">Enabled</Pill>
              <Button size="small" variant="outlined">
                View Logs
              </Button>
            </div>
          </div>
        ]
      }
    ]
  }
};
