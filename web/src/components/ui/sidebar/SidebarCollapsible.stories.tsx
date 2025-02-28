import type { Meta, StoryObj } from '@storybook/react';
import { SidebarCollapsible } from './SidebarCollapsible';
//import { Home, Settings, User } from 'lucide-react';
import { HouseModern, MapSettings, User } from '../icons/NucleoIconOutlined';
import { BusterRoutes } from '@/routes';

const meta: Meta<typeof SidebarCollapsible> = {
  title: 'UI/Sidebar/SidebarCollapsible',
  component: SidebarCollapsible,
  parameters: {
    layout: 'centered'
  },
  decorators: [
    (Story) => (
      <div className="bg-background min-w-[270px]">
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof SidebarCollapsible>;

export const Default: Story = {
  args: {
    label: 'Settings',
    items: [
      {
        id: '1',
        label: 'Profile',
        icon: <User />,
        route: BusterRoutes.SETTINGS
      },
      {
        id: '2',
        label: 'Account',
        icon: <MapSettings />,
        route: BusterRoutes.APP_CHAT
      },
      {
        id: '3',
        label: 'Dashboard',
        icon: <HouseModern />,
        route: BusterRoutes.APP_METRIC
      }
    ]
  }
};
