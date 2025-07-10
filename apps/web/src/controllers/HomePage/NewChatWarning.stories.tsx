import type { Meta, StoryObj } from '@storybook/react';
import { NewChatWarning } from './NewChatWarning';
import { z } from 'zod/v4';
import type { OrganizationRole } from '@buster/server-shared/organization';

const OrganizationRoleSchema: Record<OrganizationRole, string> = {
  data_admin: 'data_admin',
  workspace_admin: 'workspace_admin',
  querier: 'querier',
  restricted_querier: 'restricted_querier',
  viewer: 'viewer',
};

const meta: Meta<typeof NewChatWarning> = {
  title: 'Controllers/HomePage/NewChatWarning',
  component: NewChatWarning,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A setup checklist component that guides users through connecting data sources and creating datasets before they can start chatting.'
      }
    }
  },
  argTypes: {
    hasDatasets: {
      control: 'boolean',
      description: 'Whether the user has created any datasets'
    },
    hasDatasources: {
      control: 'boolean',
      description: 'Whether the user has connected any data sources'
    },
    isAdmin: {
      control: 'boolean',
      description: 'Whether the user has admin privileges'
    },
    userRole: {
      control: 'select',
      options: Object.values(OrganizationRoleSchema),
      description: "The user's role in the organization"
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default state - new admin user with nothing set up
export const NewUser: Story = {
  args: {
    hasDatasets: false,
    hasDatasources: false,
    isAdmin: true,
    userRole: OrganizationRoleSchema.data_admin
  }
};

// Complete setup - admin user has both datasets and datasources
export const CompleteSetup: Story = {
  args: {
    hasDatasets: true,
    hasDatasources: true,
    isAdmin: true,
    userRole: OrganizationRoleSchema.data_admin
  }
};

// Workspace admin with complete setup
export const WorkspaceAdminCompleteSetup: Story = {
  args: {
    hasDatasets: true,
    hasDatasources: true,
    isAdmin: true,
    userRole: OrganizationRoleSchema.workspace_admin
  }
};

// Non-admin users - show contact admin card
export const ViewerRole: Story = {
  args: {
    hasDatasets: false,
    hasDatasources: false,
    isAdmin: false,
    userRole: OrganizationRoleSchema.viewer
  }
};

export const QuerierRole: Story = {
  args: {
    hasDatasets: false,
    hasDatasources: false,
    isAdmin: false,
    userRole: OrganizationRoleSchema.querier
  }
};

export const RestrictedQuerierRole: Story = {
  args: {
    hasDatasets: false,
    hasDatasources: false,
    isAdmin: false,
    userRole: OrganizationRoleSchema.restricted_querier
  }
};
