import type { Meta, StoryObj } from '@storybook/react-vite';
import { BusterInput } from './BusterInput';

const meta: Meta<typeof BusterInput> = {
  title: 'UI/Inputs/BusterInput',
  component: BusterInput,
  tags: ['autodocs'],
  args: {},
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof BusterInput>;

export const Default: Story = {
  args: {
    value: 'Sample text value',
  },
};
