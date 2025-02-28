import type { Meta, StoryObj } from '@storybook/react';
import { SidebarPrimary } from './SidebarPrimary';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { ShareAssetType } from '@/api/asset_interfaces/share/shareInterfaces';

const meta: Meta<typeof SidebarPrimary> = {
  title: 'Features/Sidebars/SidebarPrimary',
  component: SidebarPrimary,
  parameters: {
    layout: 'fullscreen'
  },
  decorators: [
    (Story) => (
      <div className="bg-background-secondary h-screen w-[300px]">
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof SidebarPrimary>;

const mockFavorites = [
  {
    id: '123',
    name: 'Favorite Dashboard',
    asset_type: ShareAssetType.DASHBOARD,
    asset_id: '123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    route: createBusterRoute({ route: BusterRoutes.APP_DASHBOARD_ID, dashboardId: '123' })
  },
  {
    id: '456',
    name: 'Important Metrics',
    route: createBusterRoute({ route: BusterRoutes.APP_METRIC_ID, metricId: '456' }),
    asset_type: ShareAssetType.METRIC,
    asset_id: '456',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '789',
    name: 'Favorite Metric 3',
    route: createBusterRoute({ route: BusterRoutes.APP_METRIC_ID, metricId: '789' }),
    asset_type: ShareAssetType.METRIC,
    asset_id: '789',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const AdminUser: Story = {
  args: {
    isAdmin: true,
    activeRoute: BusterRoutes.APP_HOME,
    activePage: 'home',
    favorites: mockFavorites,
    onClickInvitePeople: () => alert('Invite people clicked'),
    onClickLeaveFeedback: () => alert('Leave feedback clicked')
  }
};

export const RegularUser: Story = {
  args: {
    isAdmin: false,
    activeRoute: BusterRoutes.APP_HOME,
    activePage: 'home',
    favorites: mockFavorites,
    onClickInvitePeople: () => alert('Invite people clicked'),
    onClickLeaveFeedback: () => alert('Leave feedback clicked')
  }
};

export const NoFavorites: Story = {
  args: {
    isAdmin: true,
    activeRoute: BusterRoutes.APP_HOME,
    activePage: 'home',
    favorites: null,
    onClickInvitePeople: () => alert('Invite people clicked'),
    onClickLeaveFeedback: () => alert('Leave feedback clicked')
  }
};

export const DifferentActiveRoute: Story = {
  args: {
    isAdmin: true,
    activeRoute: BusterRoutes.APP_CHAT,
    activePage: 'chat',
    favorites: mockFavorites,
    onClickInvitePeople: () => alert('Invite people clicked'),
    onClickLeaveFeedback: () => alert('Leave feedback clicked')
  }
};

export const FavoritesActiveRoute: Story = {
  args: {
    isAdmin: true,
    favorites: mockFavorites,
    activeRoute: BusterRoutes.APP_METRIC,
    activePage: createBusterRoute({ route: BusterRoutes.APP_METRIC_ID, metricId: '456' })
  }
};
