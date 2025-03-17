import type { Meta, StoryObj } from '@storybook/react';
import { ShareMenuContent } from './ShareMenuContent';
import { BusterShare, ShareAssetType, ShareRole } from '@/api/asset_interfaces';
import { ShareMenuTopBarOptions } from './ShareMenuTopBar';

const meta: Meta<typeof ShareMenuContent> = {
  title: 'Features/Share/ShareMenuContent',
  component: ShareMenuContent,
  parameters: {
    layout: 'centered'
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: '400px',
          height: '400px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof ShareMenuContent>;

const mockShareAssetConfig: BusterShare = {
  sharingKey: 'test-key',
  individual_permissions: [
    {
      email: 'test@example.com',
      role: ShareRole.VIEWER,
      id: '1',
      name: 'Test User'
    }
  ],
  team_permissions: [
    {
      name: 'Engineering',
      id: 'team-1',
      role: ShareRole.EDITOR
    }
  ],
  organization_permissions: [],
  password_secret_id: null,
  public_expiry_date: null,
  public_enabled_by: null,
  publicly_accessible: false,
  public_password: null,
  permission: ShareRole.OWNER
};

export const ShareTab: Story = {
  args: {
    shareAssetConfig: mockShareAssetConfig,
    assetId: 'test-asset-id',
    assetType: ShareAssetType.METRIC,
    selectedOptions: ShareMenuTopBarOptions.Share,
    onCopyLink: () => console.log('Copy link clicked'),
    setOpenShareWithGroupAndTeam: () => console.log('Open share with group and team'),
    goBack: () => console.log('Go back clicked')
  }
};

export const PublishTab: Story = {
  args: {
    ...ShareTab.args,
    selectedOptions: ShareMenuTopBarOptions.Publish
  }
};

export const EmbedTab: Story = {
  args: {
    ...ShareTab.args,
    selectedOptions: ShareMenuTopBarOptions.Embed
  }
};

export const ShareWithGroupAndTeamTab: Story = {
  args: {
    ...ShareTab.args,
    selectedOptions: ShareMenuTopBarOptions.ShareWithGroupAndTeam
  }
};

export const DashboardAsset: Story = {
  args: {
    ...ShareTab.args,
    assetType: ShareAssetType.DASHBOARD
  }
};

export const CollectionAsset: Story = {
  args: {
    ...ShareTab.args,
    assetType: ShareAssetType.COLLECTION
  }
};

export const WithPublicAccess: Story = {
  args: {
    ...ShareTab.args,
    shareAssetConfig: {
      ...mockShareAssetConfig,
      publicly_accessible: true,
      public_password: 'test-password',
      public_expiry_date: '2024-12-31T23:59:59Z'
    }
  }
};
