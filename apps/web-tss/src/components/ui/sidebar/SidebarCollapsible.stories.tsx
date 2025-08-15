import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { MapSettings, User } from '../icons/NucleoIconOutlined';
import { SidebarCollapsible } from './SidebarCollapsible';

const meta: Meta<typeof SidebarCollapsible> = {
  title: 'UI/Sidebar/SidebarCollapsible',
  component: SidebarCollapsible,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="bg-background min-w-[270px]">
        <Story />
      </div>
    ),
  ],
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
        route: { to: '/app/settings/profile' },
      },
      {
        id: '2',
        label: 'Account',
        icon: <MapSettings />,
        route: { to: '/app/chats' },
      },
      {
        id: '3',
        label: 'Dashboard',
        icon: <MapSettings />,
        route: { to: '/app/metrics' },
      },
    ],
  },
};

export const Sortable: Story = {
  args: {
    label: 'Sortable',
    isSortable: true,
    items: Default.args!.items!,
    onItemsReorder: fn(),
  },
};
