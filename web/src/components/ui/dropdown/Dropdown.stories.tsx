import type { Meta, StoryObj } from '@storybook/react';
import { Dropdown, DropdownItems } from './Dropdown';
import { Button } from '../buttons/Button';
import { PaintRoller, Star, Storage } from '../icons';
import { faker } from '@faker-js/faker';
import React from 'react';

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
    menuHeader: 'Menu Options',
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
    menuHeader: 'Nested Menu',
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
    menuHeader: 'Custom Width Menu',
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
      },
      { type: 'divider' },
      {
        id: '4',
        label: 'Option 4',
        onClick: () => console.log('Option 4 clicked')
      },
      {
        id: '5',
        label: 'Option 5',
        onClick: () => console.log('Option 5 clicked')
      }
    ],
    children: <Button>Menu with Loading</Button>
  }
};

// Example with selection
export const WithSelectionSingle: Story = {
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

export const WithSelectionMultiple: Story = {
  render: () => {
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set(['3']));

    const items: DropdownItems = [
      {
        id: '1',
        label: 'Option 1',
        selected: selectedIds.has('1'),
        onClick: () => console.log('Option 1 clicked')
      },
      {
        id: '2',
        label: 'Option 2',
        selected: selectedIds.has('2'),
        onClick: () => console.log('Option 2 clicked')
      },
      {
        id: '3',
        label: 'Option 3',
        selected: selectedIds.has('3'),
        onClick: () => console.log('Option 3 clicked')
      },
      { type: 'divider' as const },
      {
        id: '4',
        label: 'Option 4',
        selected: selectedIds.has('4'),
        onClick: () => console.log('Option 4 clicked')
      },
      {
        id: '5',
        label: 'Option 5',
        selected: selectedIds.has('5'),
        onClick: () => console.log('Option 5 clicked')
      }
    ];

    const handleSelect = (itemId: string) => {
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(itemId)) {
          newSet.delete(itemId);
        } else {
          newSet.add(itemId);
        }
        return newSet;
      });
    };

    return (
      <Dropdown
        selectType="multiple"
        items={items}
        menuHeader={{ placeholder: 'Search items...' }}
        onSelect={handleSelect}
        children={<Button>Selection Menu</Button>}
      />
    );
  }
};

// Example with secondary labels
export const WithSecondaryLabel: Story = {
  args: {
    menuHeader: 'Items with Secondary Labels',
    items: [
      {
        id: '1',
        label: 'Profile Settings',
        secondaryLabel: 'User preferences',
        onClick: () => console.log('Profile clicked'),
        icon: <PaintRoller />
      },
      {
        id: '2',
        label: 'Storage',
        secondaryLabel: '45GB used',
        onClick: () => console.log('Storage clicked'),
        icon: <Storage />
      },
      { type: 'divider' },
      {
        id: '3',
        label: 'Subscription',
        secondaryLabel: 'Pro Plan',
        onClick: () => console.log('Subscription clicked'),
        icon: <Star />
      }
    ],
    children: <Button>Menu with Secondary Labels</Button>
  }
};

// Example with search header
export const WithSearchHeader: Story = {
  args: {
    menuHeader: {
      placeholder: 'Search items...'
    },
    items: [
      {
        id: '1',
        label: 'Profile Settings',
        searchLabel: 'profile settings user preferences account',
        secondaryLabel: 'User preferences',
        onClick: () => console.log('Profile clicked'),
        icon: <PaintRoller />
      },
      {
        id: '2',
        label: 'Storage Options',
        searchLabel: 'storage disk space memory',
        secondaryLabel: 'Manage storage space',
        onClick: () => console.log('Storage clicked'),
        icon: <Storage />
      },
      {
        id: '3',
        label: 'Favorites',
        searchLabel: 'favorites starred items bookmarks',
        secondaryLabel: 'View starred items',
        onClick: () => console.log('Favorites clicked'),
        icon: <Star />
      },
      { type: 'divider' },
      {
        id: '4',
        label: 'Logout',

        onClick: () => console.log('Logout clicked')
      },
      {
        id: '5',
        label: 'Invite User',
        onClick: () => console.log('Invite User clicked')
      }
    ],
    children: <Button>Searchable Menu</Button>
  }
};

// Example with long text to test truncation
export const WithLongText: Story = {
  args: {
    menuHeader: {
      placeholder: 'Search items...'
    },
    items: [
      ...Array.from({ length: 100 }).map(() => {
        const label = faker.commerce.product();
        const secondaryLabel = faker.commerce.productDescription();
        return {
          id: faker.string.uuid(),
          label,
          secondaryLabel,
          searchLabel: label + ' ' + secondaryLabel,
          onClick: () => console.log('Long text clicked'),
          truncate: true
        };
      })
    ],
    children: <Button>Long Text Menu</Button>
  }
};
