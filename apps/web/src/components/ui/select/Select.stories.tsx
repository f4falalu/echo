import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { fn } from '@storybook/test';
import { Select, type SelectItem, type SelectProps } from './Select';
import { User, Gear, PowerOff } from '@/components/ui/icons/NucleoIconOutlined';

const meta = {
  title: 'UI/select/Select',
  component: Select,
  parameters: {
    layout: 'centered'
  },
  argTypes: {
    search: {
      control: { type: 'boolean' },
      description: 'Enable/disable search functionality'
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Disable the select'
    },
    loading: {
      control: { type: 'boolean' },
      description: 'Show loading state'
    },
    showIndex: {
      control: { type: 'boolean' },
      description: 'Show index numbers for items'
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text when no item is selected'
    },
    onChange: {
      action: 'onChange'
    }
  },
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    )
  ]
} satisfies Meta<SelectProps<string>>;

export default meta;
type Story = StoryObj<SelectProps<string>>;

// Basic select with simple string options
export const BasicSelect: Story = {
  args: {
    placeholder: 'Select a fruit',
    items: [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
      { value: 'orange', label: 'Orange' },
      { value: 'grape', label: 'Grape' },
      { value: 'strawberry', label: 'Strawberry' },
      { value: 'watermelon', label: 'Watermelon' },
      { value: 'pineapple', label: 'Pineapple' },
      { value: 'mango', label: 'Mango' }
    ] as SelectItem<string>[],
    onChange: fn()
  },
  render: function RenderBasicSelect(args: SelectProps<string>) {
    const [value, setValue] = React.useState<string | undefined>();

    return (
      <Select
        items={args.items}
        placeholder={args.placeholder}
        disabled={args.disabled}
        loading={args.loading}
        showIndex={args.showIndex}
        search={args.search}
        value={value}
        onChange={(newValue: string) => {
          setValue(newValue);
          (args.onChange as (value: string) => void)?.(newValue);
        }}
      />
    );
  }
};

// Advanced select with grouped items, icons, secondary labels, and custom search
export const AdvancedSelect: Story = {
  args: {
    placeholder: 'Select an action',
    items: [
      {
        label: 'Account',
        items: [
          {
            value: 'profile',
            label: 'View Profile',
            icon: <User />,
            secondaryLabel: 'See your profile details'
          },
          {
            value: 'settings',
            label: 'Settings',
            icon: <Gear />,
            secondaryLabel: 'Manage your preferences'
          }
        ]
      },
      {
        label: 'Session',
        items: [
          {
            value: 'logout',
            label: 'Log Out',
            icon: <PowerOff />,
            secondaryLabel: 'End your session',
            disabled: false
          },
          {
            value: 'switch-account',
            label: 'Switch Account',
            secondaryLabel: 'Change to another account',
            disabled: true
          }
        ]
      }
    ],
    search: (item: SelectItem<string>, searchTerm: string) => {
      // Custom search that also searches in secondary labels
      const term = searchTerm.toLowerCase();
      const labelText = typeof item.label === 'string' ? item.label.toLowerCase() : '';
      const secondaryText = item.secondaryLabel?.toLowerCase() || '';
      return labelText.includes(term) || secondaryText.includes(term);
    },
    onChange: fn()
  },
  render: function RenderAdvancedSelect(args: SelectProps<string>) {
    const [value, setValue] = React.useState<string | undefined>();

    return (
      <Select
        items={args.items}
        placeholder={args.placeholder}
        disabled={args.disabled}
        loading={args.loading}
        showIndex={args.showIndex}
        search={args.search}
        value={value}
        onChange={(newValue: string) => {
          setValue(newValue);
          (args.onChange as (value: string) => void)?.(newValue);
        }}
      />
    );
  }
};

// Select with search disabled
export const NoSearchSelect: Story = {
  args: {
    placeholder: 'Select a color',
    search: false,
    items: [
      { value: 'red', label: 'Red' },
      { value: 'green', label: 'Green' },
      { value: 'blue', label: 'Blue' },
      { value: 'yellow', label: 'Yellow' },
      { value: 'purple', label: 'Purple' },
      { value: 'orange', label: 'Orange' }
    ] as SelectItem<string>[],
    onChange: fn()
  },
  render: function RenderNoSearchSelect(args: SelectProps<string>) {
    const [value, setValue] = React.useState<string | undefined>();

    return (
      <Select
        items={args.items}
        placeholder={args.placeholder}
        disabled={args.disabled}
        loading={args.loading}
        showIndex={args.showIndex}
        search={args.search}
        value={value}
        onChange={(newValue: string) => {
          setValue(newValue);
          (args.onChange as (value: string) => void)?.(newValue);
        }}
      />
    );
  }
};

// Select with pre-selected value
export const PreSelectedValue: Story = {
  args: {
    placeholder: 'Select a size',
    items: [
      { value: 'xs', label: 'Extra Small' },
      { value: 's', label: 'Small' },
      { value: 'm', label: 'Medium' },
      { value: 'l', label: 'Large' },
      { value: 'xl', label: 'Extra Large' }
    ] as SelectItem<string>[],
    onChange: fn()
  },
  render: function RenderPreSelectedValue(args: SelectProps<string>) {
    const [value, setValue] = React.useState<string | undefined>('m');

    return (
      <Select
        items={args.items}
        placeholder={args.placeholder}
        disabled={args.disabled}
        loading={args.loading}
        showIndex={args.showIndex}
        search={args.search}
        value={value}
        onChange={(newValue: string) => {
          setValue(newValue);
          (args.onChange as (value: string) => void)?.(newValue);
        }}
      />
    );
  }
};

// Select with clearable option
export const ClearableSelect: Story = {
  args: {
    placeholder: 'Select an option (clearable)',
    clearable: true,
    items: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' },
      { value: 'option4', label: 'Option 4' },
      { value: 'option5', label: 'Option 5' }
    ] as SelectItem<string>[],
    onChange: fn()
  },
  render: function RenderClearableSelect(args: SelectProps<string>) {
    const [value, setValue] = React.useState<string | undefined>('option2');

    return (
      <Select
        items={args.items}
        placeholder={args.placeholder}
        disabled={args.disabled}
        loading={args.loading}
        showIndex={args.showIndex}
        search={args.search}
        clearable={true}
        value={value}
        onChange={(newValue: string | null) => {
          setValue(newValue as string | undefined);
          (args.onChange as (value: string | null) => void)?.(newValue);
        }}
      />
    );
  }
};
