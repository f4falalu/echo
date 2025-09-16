import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { InputNumber } from './InputNumber';

const meta: Meta<typeof InputNumber> = {
  title: 'UI/Inputs/InputNumber',
  component: InputNumber,
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
    },
    value: {
      control: 'number',
    },
    onChange: { action: 'changed' },
    min: {
      control: 'number',
    },
    max: {
      control: 'number',
    },
    step: {
      control: 'number',
    },
    size: {
      control: 'select',
      options: ['default', 'tall', 'small'],
    },
    variant: {
      control: 'select',
      options: ['default', 'ghost'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof InputNumber>;

export const Default: Story = {
  args: {
    placeholder: 'Enter number...',
  },
};

export const WithValue: Story = {
  args: {
    value: 42,
    min: 0,
    max: 42,
    placeholder: 'Enter number...',
  },
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return (
      <div className="w-full">
        <InputNumber
          {...args}
          value={value}
          onChange={(v) => {
            console.log('onChange', v);
            setValue(v);
          }}
        />
        <div className="bg-red-100 p-3 w-full hover:bg-red-200">Click to unfocus</div>
      </div>
    );
  },
};

export const WithMinMax: Story = {
  args: {
    min: 0,
    max: 100,
    placeholder: 'Enter number (0-100)...',
  },
};

export const WithStep: Story = {
  args: {
    step: 5,
    placeholder: 'Enter number (step: 5)...',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    value: 42,
    placeholder: 'Disabled number input',
  },
};

export const Small: Story = {
  args: {
    size: 'small',
    placeholder: 'Small number input...',
  },
};

export const Tall: Story = {
  args: {
    size: 'tall',
    placeholder: 'Tall number input...',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    placeholder: 'Ghost number input...',
  },
};
