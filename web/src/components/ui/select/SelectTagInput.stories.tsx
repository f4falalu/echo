import type { Meta, StoryObj } from '@storybook/react';
import { SelectTagInput } from './SelectTagInput';
import { useState } from 'react';
import { type SelectItem } from './Select';

const meta = {
  title: 'UI/Select/SelectTagInput',
  component: SelectTagInput,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof SelectTagInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseItems: SelectItem[] = [
  { value: '1', label: 'Option 1', selected: false },
  { value: '2', label: 'Option 2', selected: false },
  { value: '3', label: 'Option 3', selected: false },
  { value: '4', label: 'Option 4', selected: false },
  { value: '5', label: 'Option 5', selected: false }
];

// Interactive story with state management
const SelectTagInputWithHooks = () => {
  const [items, setItems] = useState<SelectItem[]>(baseItems);

  const handleSelect = (selectedValues: string[]) => {
    setItems(
      items.map((item) => ({
        ...item,
        selected: selectedValues.includes(item.value)
      }))
    );
  };

  return (
    <div className="w-[300px]">
      <SelectTagInput
        items={items}
        onSelect={handleSelect}
        placeholder="Select multiple options..."
      />
    </div>
  );
};

export const Default: Story = {
  args: {
    items: baseItems,
    onSelect: () => {},
    placeholder: 'Select multiple options...'
  },
  render: () => <SelectTagInputWithHooks />
};

export const WithPreselectedValues: Story = {
  args: {
    items: baseItems.map((item) => ({
      ...item,
      selected: ['1', '2'].includes(item.value)
    })),
    onSelect: () => {},
    placeholder: 'Select multiple options...'
  },
  render: (args) => (
    <div className="w-[300px]">
      <SelectTagInput {...args} />
    </div>
  )
};

export const Empty: Story = {
  args: {
    items: baseItems,
    onSelect: () => {},
    placeholder: 'Select multiple options...'
  },
  render: (args) => (
    <div className="w-[300px]">
      <SelectTagInput {...args} />
    </div>
  )
};

export const FullySelected: Story = {
  args: {
    items: baseItems.map((item) => ({
      ...item,
      selected: true
    })),
    onSelect: () => {},
    placeholder: 'Select multiple options...'
  },
  render: (args) => (
    <div className="w-[300px]">
      <SelectTagInput {...args} />
    </div>
  )
};

export const CustomWidth: Story = {
  args: {
    items: baseItems.map((item) => ({
      ...item,
      selected: ['1', '2'].includes(item.value)
    })),
    onSelect: () => {},
    placeholder: 'Select multiple options...'
  },
  render: (args) => (
    <div className="w-[500px]">
      <SelectTagInput {...args} />
    </div>
  )
};
