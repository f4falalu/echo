import type { Meta, StoryObj } from '@storybook/react-vite';
import { MentionInput } from './MentionInput';

const meta = {
  title: 'Components/UI/Inputs/MentionInput',
  component: MentionInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MentionInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'Basic mention input component that supports @mentions. Type "@" to see the autocomplete suggestions.',
      },
    },
  },
};
