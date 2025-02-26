import type { Meta, StoryObj } from '@storybook/react';
import { SelectTagInput } from './SelectTagInput';
import { useState } from 'react';
import { type SelectItem } from './Select';

const meta = {
  title: 'Base/SelectTagInput',
  component: SelectTagInput,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof SelectTagInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const items: SelectItem[] = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3' },
  { value: '4', label: 'Option 4' },
  { value: '5', label: 'Option 5' }
];

// Interactive story with state management
const SelectTagInputWithHooks = () => {
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <div className="w-[300px]">
      <SelectTagInput
        items={items}
        selected={selected}
        onSelect={(items) => setSelected(items.map((item) => item.value))}
        placeholder="Select multiple options..."
      />
    </div>
  );
};

export const Default: Story = {
  args: {
    items: items,
    selected: [],
    onSelect: () => {},
    placeholder: 'Select multiple options...'
  },
  render: () => <SelectTagInputWithHooks />
};

export const WithPreselectedValues: Story = {
  args: {
    items: items,
    selected: ['1', '2'],
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
    items: items,
    selected: [],
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
    items: items,
    selected: items.map((item) => item.value),
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
    items: items,
    selected: ['1', '2'],
    onSelect: () => {},
    placeholder: 'Select multiple options...'
  },
  render: (args) => (
    <div className="w-[500px]">
      <SelectTagInput {...args} />
    </div>
  )
};
