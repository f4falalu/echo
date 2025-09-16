import type { Meta, StoryObj } from '@storybook/react-vite';
import { testSuggestions } from '@/components/features/input/Mentions/TestSuggests';
import { MentionInput } from './MentionInput';

const meta = {
  title: 'Components/UI/Inputs/MentionInput',
  component: MentionInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      return (
        <div className="w-full p-3 m-3">
          <Story />
        </div>
      );
    },
  ],
} satisfies Meta<typeof MentionInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    mentions: [testSuggestions()],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Basic mention input component that supports @mentions. Type "@" to see the autocomplete suggestions.',
      },
    },
  },
};
