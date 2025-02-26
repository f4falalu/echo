import type { Meta, StoryObj } from '@storybook/react';
import { Dropdown, DropdownItems } from './Dropdown';
import { Button } from '../buttons/Button';
import { PaintRoller, Star, Storage } from '../icons';
import { faker } from '@faker-js/faker';
import React from 'react';

const meta: Meta<typeof Dropdown> = {
  title: 'Base/Dropdowns/Dropdown',
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
        value: '1',
        label: 'Profile',
        onClick: () => alert('Profile clicked'),
        loading: false,
        icon: <PaintRoller />
      },
      {
        value: '2',
        label: 'Settings',
        onClick: () => alert('Settings clicked'),
        shortcut: '⌘S'
      },
      {
        value: '3',
        label: 'Logout',
        onClick: () => alert('Logout clicked'),
        items: [
          {
            value: '3-1',
            label: 'Testing 123'
          },
          {
            value: '3-2',
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
        value: '1',
        label: 'Profile',
        icon: '👤',
        shortcut: '⌘P',
        onClick: () => alert('Profile clicked')
      },
      {
        value: '2',
        label: 'Settings',
        icon: '⚙️',
        shortcut: '⌘S',
        onClick: () => alert('Settings clicked')
      },
      {
        value: '3',
        label: 'Logout',
        icon: '🚪',
        shortcut: '⌘L',
        onClick: () => alert('Logout clicked')
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
        value: '1',
        label: 'Main Options',
        items: [
          {
            value: '1-1',
            label: 'Option 1',
            onClick: () => alert('Option 1 clicked')
          },
          {
            value: '1-2',
            label: 'Option 2',
            onClick: () => alert('Option 2 clicked')
          }
        ]
      },
      {
        value: '2',
        label: 'More Options',
        items: [
          {
            value: '2-1',
            label: 'Sub Option 1',
            onClick: () => alert('Sub Option 1 clicked')
          },
          {
            value: '2-2',
            label: 'Sub Option 2',
            onClick: () => alert('Sub Option 2 clicked')
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
        value: '1',
        label: 'Available Option',
        onClick: () => alert('Available clicked')
      },
      {
        value: '2',
        label: 'Disabled Option',
        disabled: true,
        onClick: () => alert('Should not be called')
      },
      {
        value: '3',
        label: 'Another Available',
        onClick: () => alert('Another clicked')
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
        value: '1',
        label: 'This is a very long menu item that might need wrapping',
        onClick: () => alert('Long item clicked')
      },
      {
        value: '2',
        label: 'Short item',
        onClick: () => alert('Short item clicked')
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
        value: '1',
        label: 'Normal Item',
        onClick: () => alert('Normal clicked')
      },
      {
        value: '2',
        label: 'Loading Item',
        loading: true,
        onClick: () => alert('Loading clicked')
      },
      {
        value: '3',
        label: 'Another Normal',
        onClick: () => alert('Another clicked')
      },
      { type: 'divider' },
      {
        value: '4',
        label: 'Option 4',
        onClick: () => alert('Option 4 clicked')
      },
      {
        value: '5',
        label: 'Option 5',
        onClick: () => alert('Option 5 clicked')
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
        value: '1',
        label: 'Option 1',
        selected: false,
        onClick: () => alert('Option 1 clicked')
      },
      {
        value: '2',
        label: 'Option 2',
        onClick: () => alert('Option 2 clicked')
      },
      {
        value: '3',
        label: 'Option 3 - Selected',
        onClick: () => alert('Option 3 clicked'),
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
        value: '1',
        label: 'Option 1',
        selected: selectedIds.has('1'),
        onClick: () => alert('Option 1 clicked')
      },
      {
        value: '2',
        label: 'Option 2',
        selected: selectedIds.has('2'),
        onClick: () => alert('Option 2 clicked')
      },
      {
        value: '3',
        label: 'Option 3',
        selected: selectedIds.has('3'),
        onClick: () => alert('Option 3 clicked')
      },
      { type: 'divider' as const },
      {
        value: '4',
        label: 'Option 4',
        selected: selectedIds.has('4'),
        onClick: () => alert('Option 4 clicked')
      },
      {
        value: '5',
        label: 'Option 5',
        selected: selectedIds.has('5'),
        onClick: () => alert('Option 5 clicked')
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
        value: '1',
        label: 'Profile Settings',
        secondaryLabel: 'User preferences',
        onClick: () => alert('Profile clicked'),
        icon: <PaintRoller />
      },
      {
        value: '2',
        label: 'Storage',
        secondaryLabel: '45GB used',
        onClick: () => alert('Storage clicked'),
        icon: <Storage />
      },
      { type: 'divider' },
      {
        value: '3',
        label: 'Subscription',
        secondaryLabel: 'Pro Plan',
        onClick: () => alert('Subscription clicked'),
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
        value: '1',
        label: 'Profile Settings',
        searchLabel: 'profile settings user preferences account',
        secondaryLabel: 'User preferences',
        onClick: () => alert('Profile clicked'),
        icon: <PaintRoller />
      },
      {
        value: '2',
        label: 'Storage Options',
        searchLabel: 'storage disk space memory',
        secondaryLabel: 'Manage storage space',
        onClick: () => alert('Storage clicked'),
        icon: <Storage />
      },
      {
        value: '3',
        label: 'Favorites',
        searchLabel: 'favorites starred items bookmarks',
        secondaryLabel: 'View starred items',
        onClick: () => alert('Favorites clicked'),
        icon: <Star />
      },
      { type: 'divider' },
      {
        value: '4',
        label: 'Logout',

        onClick: () => alert('Logout clicked')
      },
      {
        value: '5',
        label: 'Invite User',
        onClick: () => alert('Invite User clicked')
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
          value: faker.string.uuid(),
          label,
          secondaryLabel,
          searchLabel: label + ' ' + secondaryLabel,
          onClick: () => alert('Long text clicked'),
          truncate: true
        };
      })
    ],
    children: <Button>Long Text Menu</Button>
  }
};

// Example with links
export const WithLinks: Story = {
  args: {
    menuHeader: 'Navigation Links',
    items: [
      {
        value: '1',
        label: 'Documentation',
        link: '/docs',
        icon: <Storage />,
        onClick: () => alert('Documentation clicked')
      },
      {
        value: '2',
        label: 'GitHub Repository',
        link: 'https://github.com/example/repo',
        icon: <Star />,
        secondaryLabel: 'External Link'
      },
      { type: 'divider' },
      {
        value: '3',
        label: 'Settings Page',
        link: '/settings',
        icon: <PaintRoller />
      },
      {
        value: '4',
        label: 'Help Center',
        link: '/help',
        secondaryLabel: 'Get Support'
      }
    ],
    children: <Button>Menu with Links</Button>
  }
};

// Interactive example with links and multiple selection
export const WithLinksAndMultipleSelection: Story = {
  render: () => {
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set(['2']));

    const items: DropdownItems = [
      {
        value: '1',
        label: 'Documentation Home',
        link: '/docs',
        selected: selectedIds.has('1'),
        icon: <Storage />,
        secondaryLabel: 'Main documentation'
      },
      {
        value: '2',
        label: 'API Reference',
        link: '/docs/api',
        selected: selectedIds.has('2'),
        icon: <Star />,
        secondaryLabel: 'API documentation'
      },
      { type: 'divider' as const },
      {
        value: '3',
        label: 'Tutorials',
        link: '/docs/tutorials',
        selected: selectedIds.has('3'),
        icon: <PaintRoller />,
        secondaryLabel: 'Learn step by step'
      },
      {
        value: '4',
        label: 'Examples',
        link: '/docs/examples',
        selected: selectedIds.has('4'),
        secondaryLabel: 'Code examples'
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
        open
        selectType="multiple"
        items={items}
        menuHeader={{ placeholder: 'Search documentation...' }}
        onSelect={handleSelect}
        children={<Button>Documentation Sections</Button>}
      />
    );
  }
};
