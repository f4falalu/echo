import type { Meta, StoryObj } from '@storybook/react';
import { ReasoningMessage_PillsContainer } from './ReasoningMessage_PillsContainer';
import type { BusterChatMessageReasoning_pills } from '@/api/asset_interfaces';

const meta: Meta<typeof ReasoningMessage_PillsContainer> = {
  title: 'Controllers/ReasoningController/ReasoningMessage_PillsContainer',
  component: ReasoningMessage_PillsContainer,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof ReasoningMessage_PillsContainer>;

const mockReasoningMessage: BusterChatMessageReasoning_pills = {
  id: '1',
  type: 'pills',
  title: 'Found Terms',
  secondary_title: 'Analyzing content',
  pill_containers: [
    {
      title: 'Important Terms',
      pills: [
        { text: 'React', type: 'term', id: '1' },
        { text: 'TypeScript', type: 'term', id: '2' },
        { text: 'Components', type: 'term', id: '3' }
      ]
    },
    {
      title: 'Technical Concepts',
      pills: [
        { text: 'State Management', type: 'term', id: '4' },
        { text: 'Props', type: 'term', id: '5' },
        { text: 'Hooks', type: 'term', id: '6' }
      ]
    }
  ],
  status: 'completed'
};

export const Default: Story = {
  args: {
    reasoningMessage: mockReasoningMessage,
    isCompletedStream: true,
    isLastMessageItem: false,
    chatId: '123'
  }
};

export const Loading: Story = {
  args: {
    reasoningMessage: {
      ...mockReasoningMessage,
      status: 'loading'
    },
    isCompletedStream: false,
    isLastMessageItem: true,
    chatId: '123'
  }
};

export const Failed: Story = {
  args: {
    reasoningMessage: {
      ...mockReasoningMessage,
      status: 'failed'
    },
    isCompletedStream: true,
    isLastMessageItem: false,
    chatId: '123'
  }
};

export const EmptyPills: Story = {
  args: {
    reasoningMessage: {
      ...mockReasoningMessage,
      pill_containers: []
    },
    isCompletedStream: true,
    isLastMessageItem: false,
    chatId: '123'
  }
};

export const SingleContainer: Story = {
  args: {
    reasoningMessage: {
      ...mockReasoningMessage,
      pill_containers: [mockReasoningMessage.pill_containers![0]]
    },
    isCompletedStream: true,
    isLastMessageItem: false,
    chatId: '123'
  }
};
