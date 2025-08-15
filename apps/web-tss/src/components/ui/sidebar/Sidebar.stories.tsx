import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Check3, Window, WindowSettings, WindowUser } from '../icons/NucleoIconOutlined';
import type { ISidebarGroup, ISidebarItem } from './interfaces';
import { Sidebar } from './Sidebar';

const meta: Meta<typeof Sidebar> = {
  title: 'UI/Sidebar/Sidebar',
  component: Sidebar,
  decorators: [
    (Story) => (
      <div className="h-[500px] w-64 bg-transparent">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

const mockItems: ISidebarItem[] = [
  {
    id: '1',
    label: 'Home',
    icon: <Window />,
    route: {
      to: '/app/home',
    },
  },
  {
    id: '2',
    label: 'Profile',
    icon: <WindowUser />,
    route: {
      to: '/app/settings/profile',
    },
  },
  {
    id: '3',
    label: 'Settings',
    icon: <WindowSettings />,
    route: {
      to: '/app/settings/profile',
    },
  },
];

const mockGroupedContent: ISidebarGroup[] = [
  {
    id: 'notifications',
    label: 'Notifications',
    items: [
      {
        id: '4',
        label: 'Notifications',
        icon: <Check3 width="1.25em" height="1.25em" />,
        route: {
          to: '/app/settings/profile',
        },
      },
      {
        id: '5',
        label: 'Notifications',
        icon: <Check3 width="1.25em" height="1.25em" />,
        route: {
          to: '/app',
        },
      },
    ] satisfies ISidebarItem[],
  },
  {
    id: 'main-menu',
    label: 'Main Menu',
    items: mockItems,
  },
];

export const Default: Story = {
  args: {
    header: <div className="text-xl font-semibold">My App</div>,
    content: mockGroupedContent,
    footer: (
      <div className="flex h-full items-center justify-center text-sm text-gray-500">Footer</div>
    ),
  },
};

export const WithLongContent: Story = {
  args: {
    header: <div className="text-xl font-semibold">My App</div>,
    content: [
      {
        id: 'main-menu',
        label: 'Main Menu',
        items: [...Array(20)].map((_, i) => ({
          id: `item-${i}`,
          label: `Menu Item ${i + 1}`,
          icon: <Window width="1.25em" height="1.25em" />,
          route: {
            to: '/app/home',
            activeOptions: {
              exact: true,
            },
          },
          active: i === 0,
        })),
      },
    ],
    footer: <div className="text-sm text-gray-500">Sticky Footer</div>,
  },
};

export const NoFooter: Story = {
  args: {
    header: <div className="text-xl font-semibold">My App</div>,
    content: mockGroupedContent,
  },
};

export const ScrollAndTruncationTest: Story = {
  args: {
    header: <div className="text-xl font-semibold">Scroll & Truncation Test</div>,
    content: [
      {
        id: 'default-items',
        items: mockItems,
      },
      {
        id: 'short-items',
        label: 'Short Items',
        items: [...Array(20)].map((_, i) => ({
          id: `short-${i}`,
          label: `Item ${i + 1}`,
          icon: <Window width="1.25em" height="1.25em" />,
          route: {
            to: '/app/home',
          },
          active: i === 4,
        })),
      },
      {
        id: 'long-items',
        label: 'Long Items',
        items: [
          {
            id: 'long-1',
            label:
              'This is an extremely long menu item that should definitely get truncated in the UI because it is way too long to fit',
            icon: <WindowSettings width="1.25em" height="1.25em" />,
            route: {
              to: '/app/settings/profile',
            },
          },
          {
            id: 'long-2',
            label:
              'Another very long label that contains some technical terms like Implementation Documentation Requirements',
            icon: <WindowUser width="1.25em" height="1.25em" />,
            route: {
              to: '/app/settings/profile',
            },
          },
          ...Array(30)
            .fill(null)
            .map(
              (_, i) =>
                ({
                  id: `long-${i + 3}`,
                  label: `Somewhat Long Menu Item ${i + 1} with Additional Description Text`,
                  icon: <Check3 width="1.25em" height="1.25em" />,
                  route: {
                    to: '/app/settings/profile',
                  },
                }) satisfies ISidebarItem
            ),
        ],
      },
    ],
    footer: <div className="text-sm text-gray-500">Footer for Scroll Test</div>,
  },
};

export const WithRemovableItems: Story = {
  args: {
    header: <div className="text-xl font-semibold">My App</div>,
    content: [
      {
        id: 'removable-items',
        label: 'Removable Items',
        items: mockItems.map((item) => ({
          ...item,
          onRemove: fn(),
        })),
      },
      {
        id: 'fixed-items',
        label: 'Fixed Items',
        items: mockItems,
      },
    ],
    footer: <div className="text-sm text-gray-500">Footer</div>,
  },
};
