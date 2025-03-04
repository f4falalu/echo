import type { Meta, StoryObj } from '@storybook/react';
import { ShareMenu } from './ShareMenu';
import { BusterShare, ShareAssetType, ShareRole } from '@/api/asset_interfaces';
import { Button } from 'antd';

const meta: Meta<typeof ShareMenu> = {
  title: 'Features/Share/ShareMenu',
  component: ShareMenu,
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
type Story = StoryObj<typeof ShareMenu>;

const mockShareConfig: BusterShare = {
  sharingKey: 'mock-sharing-key',
  individual_permissions: null,
  team_permissions: null,
  organization_permissions: null,
  password_secret_id: null,
  public_expiry_date: null,
  public_enabled_by: null,
  publicly_accessible: false,
  public_password: null,
  permission: ShareRole.OWNER
};

export const Default: Story = {
  args: {
    shareAssetConfig: mockShareConfig,
    assetId: '123',
    assetType: ShareAssetType.DASHBOARD,
    children: <Button>Share</Button>
  }
};

export const ViewerPermission: Story = {
  args: {
    ...Default.args,
    shareAssetConfig: {
      ...mockShareConfig,
      permission: ShareRole.VIEWER
    }
  }
};

export const PublicAsset: Story = {
  args: {
    ...Default.args,
    shareAssetConfig: {
      ...mockShareConfig,
      publicly_accessible: true
    }
  }
};
