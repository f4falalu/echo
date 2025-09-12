import type { Meta, StoryObj } from '@storybook/react-vite';
import { BusterInput } from './BusterInput';
import type { BusterInputProps } from './BusterInput.types';

const meta: Meta<typeof BusterInput> = {
  title: 'UI/Inputs/BusterInput',
  component: BusterInput,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof BusterInput>;

const items: BusterInputProps['items'] = [
  ...Array.from({ length: 3 }, (_, i) => ({
    label: `Item ${i + 1}`,
    value: `item${i + 1}`,
  })),
  {
    label: 'Item (disabled)',
    value: 'item-disabled',
    disabled: true,
  },
  {
    label: 'Item (loading)',
    value: 'item-loading',
    loading: true,
  },
  {
    label: 'Item do not close on select',
    value: 'asdf',
    closeOnSelect: false,
  },
];

const mentions: BusterInputProps['mentions'] = [
  {
    trigger: '@',
    items: [
      {
        value: '1',
        label: 'BigNate',
      },
      {
        value: '2',
        label: 'ReactFan42',
      },
      {
        value: '3',
        label: 'NextJSDev',
      },
    ],
  },
  {
    trigger: '#',
    items: [
      {
        value: '1',
        label: 'My number is 1',
      },
      {
        value: '2',
        label: 'My number is 2',
      },
    ],
  },
];

export const Default: Story = {
  args: {
    value: 'Sample text value',
    items,
    mentions,
  },
};
