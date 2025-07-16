import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { useState } from 'react';
import { InputSearchDropdown, type InputSearchDropdownProps } from './InputSearchDropdown';
import { useDebounceFn, useMemoizedFn } from '../../../hooks';

const meta: Meta<typeof InputSearchDropdown> = {
  title: 'UI/inputs/InputSearchDropdown',
  component: InputSearchDropdown,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    onSelect: {
      action: 'selected'
    },
    onSearch: {
      action: 'searched'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleOptions = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry' },
  { label: 'Date', value: 'date' },
  { label: 'Elderberry', value: 'elderberry' },
  { label: 'Fig', value: 'fig' },
  { label: 'Grape', value: 'grape' },
  { label: 'Honeydew', value: 'honeydew' }
];

// Interactive story with state management
const InputSearchDropdownWithState = (
  args: Omit<
    InputSearchDropdownProps,
    'options' | 'onSelect' | 'onSearch' | 'value' | 'onPressEnter'
  > & {
    value?: string;
  }
) => {
  const [value, setValue] = useState(args.value || '');
  const [filteredOptions, setFilteredOptions] = useState(sampleOptions);

  const { run: handleSearch, cancel } = useDebounceFn(
    async (searchValue: string) => {
      action('searched')(searchValue);
      const filtered = sampleOptions.filter((option) =>
        option.label.toLowerCase().includes(searchValue.toLowerCase())
      );
      setFilteredOptions(filtered);
    },
    { wait: 600 }
  );

  const handleSelect = useMemoizedFn((selectedValue: string) => {
    action('selected')(selectedValue);
    setValue(selectedValue);
  });

  const handlePressEnter = useMemoizedFn((value: string) => {
    action('pressedEnter')(value);
  });

  return (
    <div className="w-80">
      <InputSearchDropdown
        {...args}
        options={filteredOptions}
        onSearch={handleSearch}
        onSelect={handleSelect}
        onPressEnter={handlePressEnter}
      />
      <div className="mt-2 w-fit rounded border border-red-500 p-1">{value}</div>
    </div>
  );
};

export const Default: Story = {
  render: (args) => <InputSearchDropdownWithState {...args} />,
  args: {
    placeholder: 'Search fruits...',
    value: '',
    placement: 'bottom',
    popoverMatchWidth: true
  }
};

export const WithInitialValue: Story = {
  render: (args) => <InputSearchDropdownWithState {...args} />,
  args: {
    placeholder: 'Search fruits...',
    value: 'Apple',

    popoverMatchWidth: true
  }
};

export const CustomEmptyState: Story = {
  render: (args) => <InputSearchDropdownWithState {...args} />,
  args: {
    placeholder: 'Search fruits...',
    value: '',
    emptyMessage: 'No fruits found matching your search'
  }
};

export const CustomStyling: Story = {
  render: (args) => <InputSearchDropdownWithState {...args} />,
  args: {
    placeholder: 'Search fruits...',
    value: '',
    className: 'border-2 border-blue-500 rounded-lg',
    popoverClassName: 'bg-blue-50 border border-blue-200'
  }
};

// Story with complex options (React nodes)
const complexOptions = [
  {
    label: (
      <div className="flex items-center gap-2">
        <span className="h-4 w-4 rounded-full bg-red-500"></span>
        <span>Apple</span>
        <span className="text-sm text-gray-500">(Red fruit)</span>
      </div>
    ),
    value: 'apple'
  },
  {
    label: (
      <div className="flex items-center gap-2">
        <span className="h-4 w-4 rounded-full bg-yellow-500"></span>
        <span>Banana</span>
        <span className="text-sm text-gray-500">(Yellow fruit)</span>
      </div>
    ),
    value: 'banana'
  },
  {
    label: (
      <div className="flex items-center gap-2">
        <span className="h-4 w-4 rounded-full bg-red-600"></span>
        <span>Cherry</span>
        <span className="text-sm text-gray-500">(Small red fruit)</span>
      </div>
    ),
    value: 'cherry'
  }
];

const ComplexInputSearchDropdown = (args: any) => {
  const [value, setValue] = useState(args.value || '');
  const [filteredOptions, setFilteredOptions] = useState(complexOptions);

  const handleSearch = (searchValue: string) => {
    action('searched')(searchValue);
    const filtered = complexOptions.filter((option) => {
      const labelText = typeof option.label === 'string' ? option.label : 'Apple Banana Cherry'; // Simplified for demo
      return labelText.toLowerCase().includes(searchValue.toLowerCase());
    });
    setFilteredOptions(filtered);
  };

  const handleSelect = (selectedValue: string) => {
    action('selected')(selectedValue);
    const selectedOption = complexOptions.find((option) => option.value === selectedValue);
    setValue(selectedValue);
  };

  return (
    <div className="w-80">
      <InputSearchDropdown
        {...args}
        options={filteredOptions}
        value={value}
        onSearch={handleSearch}
        onSelect={handleSelect}
      />
    </div>
  );
};

export const ComplexOptions: Story = {
  render: (args) => <ComplexInputSearchDropdown {...args} />,
  args: {
    placeholder: 'Search fruits with icons...',
    value: '',
    placement: 'bottom',
    popoverMatchWidth: true
  }
};
