import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { AccessRoleSelect } from './AccessRoleSelect';
import type { OrganizationRole } from '@buster/server-shared/organization';

const meta: Meta<typeof AccessRoleSelect> = {
  title: 'Features/Security/AccessRoleSelect',
  component: AccessRoleSelect,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A select component for choosing organization access roles with titles and descriptions.'
      }
    }
  },
  argTypes: {
    role: {
      control: 'select',
      options: ['viewer', 'restricted_querier', 'querier', 'data_admin', 'workspace_admin'],
      description: 'The currently selected organization role'
    },
    onChange: {
      action: 'role-changed',
      description: 'Callback function called when role selection changes'
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof AccessRoleSelect>;

// Default story
export const Default: Story = {
  args: {
    role: 'viewer',
    onChange: action('role-changed')
  }
};

// Interactive story where users can change roles
export const Interactive: Story = {
  args: {
    role: 'querier',
    onChange: action('role-changed')
  }
};

// Stories for each specific role
export const Viewer: Story = {
  args: {
    role: 'viewer',
    onChange: action('role-changed')
  }
};

export const RestrictedQuerier: Story = {
  args: {
    role: 'restricted_querier',
    onChange: action('role-changed')
  }
};

export const Querier: Story = {
  args: {
    role: 'querier',
    onChange: action('role-changed')
  }
};

export const DataAdmin: Story = {
  args: {
    role: 'data_admin',
    onChange: action('role-changed')
  }
};

export const WorkspaceAdmin: Story = {
  args: {
    role: 'workspace_admin',
    onChange: action('role-changed')
  }
};

// Story without initial role (uses default)
export const NoInitialRole: Story = {
  args: {
    onChange: action('role-changed')
  }
};
