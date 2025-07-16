import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Select, SelectItem } from './Select';
import { useDebounceFn } from '../../../hooks';

const meta: Meta<typeof Select> = {
  title: 'UI/select/Select',
  component: Select,
  parameters: {
    layout: 'centered'
  },
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof Select>;

// Basic items for examples
const basicItems: SelectItem[] = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3' },
  { value: '4', label: 'Option 4' },
  { value: '5', label: 'Option 5' }
];

const userItems: SelectItem[] = [
  { value: 'john', label: 'John Doe', secondaryLabel: 'john@example.com' },
  { value: 'jane', label: 'Jane Smith', secondaryLabel: 'jane@example.com' },
  { value: 'bob', label: 'Bob Johnson', secondaryLabel: 'bob@example.com' },
  { value: 'alice', label: 'Alice Williams', secondaryLabel: 'alice@example.com' },
  { value: 'charlie', label: 'Charlie Brown', secondaryLabel: 'charlie@example.com' }
];

// Basic select without search
export const Basic: Story = {
  args: {
    items: basicItems,
    placeholder: 'Select an option'
  }
};

// Select with search enabled
export const WithSearch: Story = {
  args: {
    items: userItems,
    placeholder: 'Search users...',
    search: true
  }
};

// Select with custom search function
export const WithCustomSearch: Story = {
  args: {
    items: userItems,
    placeholder: 'Search by email...',
    search: {
      type: 'filter',
      fn: (item, searchTerm) => {
        // Search only in email (secondaryLabel)
        const email = item.secondaryLabel || '';
        return email.toLowerCase().includes(searchTerm.toLowerCase());
      }
    }
  }
};

// Clearable select
export const Clearable: Story = {
  args: {
    items: basicItems,
    placeholder: 'Select an option',
    clearable: true,
    search: true
  }
};

// Controlled input example
export const ControlledInput: Story = {
  render: () => {
    const [inputValue, setInputValue] = React.useState('');
    const [selectedValue, setSelectedValue] = React.useState<string | null>(null);

    return (
      <div>
        <p style={{ marginTop: '10px', fontSize: '14px' }}>Search value: "{inputValue}"</p>
        <p style={{ fontSize: '14px' }}>Selected value: {selectedValue || 'None'}</p>
        <Select
          items={userItems}
          value={selectedValue || undefined}
          onChange={setSelectedValue}
          inputValue={inputValue}
          onInputValueChange={setInputValue}
          placeholder="Controlled search..."
          search={true}
        />
      </div>
    );
  }
};

// Async search example
export const AsyncSearch: Story = {
  render: () => {
    const [items, setItems] = React.useState<SelectItem[]>([]);
    const [inputValue, setInputValue] = React.useState('');
    const [selectedValue, setSelectedValue] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const timeoutRef = React.useRef<NodeJS.Timeout>();

    const { run: debouncedSetInputValue } = useDebounceFn(
      async (value: string) => {
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Filter users based on search term
        const filtered = userItems.filter((item) => {
          const labelText = typeof item.label === 'string' ? item.label : '';
          return (
            labelText.toLowerCase().includes(inputValue.toLowerCase()) ||
            (item.secondaryLabel?.toLowerCase().includes(inputValue.toLowerCase()) ?? false)
          );
        });

        setItems(filtered);
        setIsLoading(false);
      },
      { wait: 500 }
    );

    // Simulate API search with debouncing
    React.useEffect(() => {
      if (!inputValue) {
        setItems([]);
        return;
      }

      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setIsLoading(true);

      debouncedSetInputValue(inputValue);
    }, [inputValue]);

    return (
      <div>
        <p style={{ marginTop: '10px', fontSize: '14px' }}>
          {isLoading ? 'Loading...' : `Found ${items.length} results`}
        </p>
        <p style={{ fontSize: '14px' }}>Search value: "{inputValue}"</p>
        <Select
          items={items}
          value={selectedValue || undefined}
          onChange={setSelectedValue}
          inputValue={inputValue}
          onInputValueChange={setInputValue}
          placeholder="Search users (async)..."
          search={true}
          emptyMessage={inputValue ? 'No users found' : 'Type to search users'}
        />
      </div>
    );
  }
};

// Grouped items example
export const GroupedItems: Story = {
  args: {
    items: [
      {
        label: 'Fruits',
        items: [
          { value: 'apple', label: 'Apple' },
          { value: 'banana', label: 'Banana' },
          { value: 'orange', label: 'Orange' }
        ]
      },
      {
        label: 'Vegetables',
        items: [
          { value: 'carrot', label: 'Carrot' },
          { value: 'broccoli', label: 'Broccoli' },
          { value: 'spinach', label: 'Spinach' }
        ]
      }
    ],
    placeholder: 'Select a food...',
    search: true
  }
};

// Disabled state
export const Disabled: Story = {
  args: {
    items: basicItems,
    placeholder: 'Select an option',
    disabled: true
  }
};

// With icons example
export const WithIcons: Story = {
  args: {
    items: [
      { value: 'home', label: 'Home', icon: '🏠' },
      { value: 'work', label: 'Work', icon: '💼' },
      { value: 'school', label: 'School', icon: '🎓' },
      { value: 'gym', label: 'Gym', icon: '💪' }
    ],
    placeholder: 'Select a location...',
    search: true
  }
};

// Loading state example
export const LoadingState: Story = {
  args: {
    items: userItems,
    placeholder: 'Loading...',
    loading: true,
    search: true
  }
};
