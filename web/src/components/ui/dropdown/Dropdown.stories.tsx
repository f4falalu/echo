import type { Meta, StoryObj } from '@storybook/react';
import { Dropdown } from './Dropdown';
import { Button } from '../buttons/Button';
import { PaintRoller } from '../icons';
const meta: Meta<typeof Dropdown> = {
  title: 'Base/Dropdown',
  component: Dropdown,
  parameters: {
    layout: 'centered'
  },
  argTypes: {
    closeOnSelect: {
      control: 'boolean',
      defaultValue: true
    },
    align: {
      control: 'select',
      options: ['start', 'center', 'end'],
      defaultValue: 'start'
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof Dropdown>;

// Basic example with simple items
export const Basic: Story = {
  args: {
    items: [
      {
        id: '1',
        label: 'Profile',
        onClick: () => console.log('Profile clicked'),
        loading: false,
        icon: <PaintRoller />
      },
      {
        id: '2',
        label: 'Settings',
        onClick: () => console.log('Settings clicked'),
        shortcut: '⌘S'
      },
      {
        id: '3',
        label: 'Logout',
        onClick: () => console.log('Logout clicked'),
        items: [
          {
            id: '3-1',
            label: 'Testing 123'
          },
          {
            id: '3-2',
            label: 'Testing 456'
          }
        ]
      }
    ],
    children: <Button>Open Menu</Button>
  }
};

// Example with icons and shortcuts
export const WithIconsAndShortcuts: Story = {
  args: {
    menuLabel: 'Menu Options',
    items: [
      {
        id: '1',
        label: 'Profile',
        icon: '👤',
        shortcut: '⌘P',
        onClick: () => console.log('Profile clicked')
      },
      {
        id: '2',
        label: 'Settings',
        icon: '⚙️',
        shortcut: '⌘S',
        onClick: () => console.log('Settings clicked')
      },
      {
        id: '3',
        label: 'Logout',
        icon: '🚪',
        shortcut: '⌘L',
        onClick: () => console.log('Logout clicked')
      }
    ],
    children: <Button>Menu with Icons</Button>
  }
};

// Example with nested items
export const WithNestedItems: Story = {
  args: {
    menuLabel: 'Nested Menu',
    items: [
      {
        id: '1',
        label: 'Main Options',
        items: [
          {
            id: '1-1',
            label: 'Option 1',
            onClick: () => console.log('Option 1 clicked')
          },
          {
            id: '1-2',
            label: 'Option 2',
            onClick: () => console.log('Option 2 clicked')
          }
        ]
      },
      {
        id: '2',
        label: 'More Options',
        items: [
          {
            id: '2-1',
            label: 'Sub Option 1',
            onClick: () => console.log('Sub Option 1 clicked')
          },
          {
            id: '2-2',
            label: 'Sub Option 2',
            onClick: () => console.log('Sub Option 2 clicked')
          }
        ]
      }
    ],
    children: <Button>Nested Menu</Button>
  }
};

// Example with disabled items
export const WithDisabledItems: Story = {
  args: {
    items: [
      {
        id: '1',
        label: 'Available Option',
        onClick: () => console.log('Available clicked')
      },
      {
        id: '2',
        label: 'Disabled Option',
        disabled: true,
        onClick: () => console.log('Should not be called')
      },
      {
        id: '3',
        label: 'Another Available',
        onClick: () => console.log('Another clicked')
      }
    ],
    children: <Button>Menu with Disabled Items</Button>
  }
};

// Example with custom widths
export const CustomWidth: Story = {
  args: {
    menuLabel: 'Custom Width Menu',
    minWidth: 300,
    maxWidth: 400,
    items: [
      {
        id: '1',
        label: 'This is a very long menu item that might need wrapping',
        onClick: () => console.log('Long item clicked')
      },
      {
        id: '2',
        label: 'Short item',
        onClick: () => console.log('Short item clicked')
      }
    ],
    children: <Button>Wide Menu</Button>
  }
};

// Example with loading state
export const WithLoadingItems: Story = {
  args: {
    items: [
      {
        id: '1',
        label: 'Normal Item',
        onClick: () => console.log('Normal clicked')
      },
      {
        id: '2',
        label: 'Loading Item',
        loading: true,
        onClick: () => console.log('Loading clicked')
      },
      {
        id: '3',
        label: 'Another Normal',
        onClick: () => console.log('Another clicked')
      }
    ],
    children: <Button>Menu with Loading</Button>
  }
};

// Example with selection
export const WithSelection: Story = {
  args: {
    selectType: 'single',
    items: [
      {
        id: '1',
        label: 'Option 1',
        selected: false,
        onClick: () => console.log('Option 1 clicked')
      },
      {
        id: '2',
        label: 'Option 2',
        onClick: () => console.log('Option 2 clicked')
      },
      {
        id: '3',
        label: 'Option 3 - Selected',
        onClick: () => console.log('Option 3 clicked'),
        selected: true
      }
    ],
    children: <Button>Selection Menu</Button>
  }
};
