import type { Meta, StoryObj } from '@storybook/react';
import { ReasoningMessage_PillsContainer } from './ReasoningMessage_PillsContainer';
import type { BusterChatMessageReasoning_pills, ThoughtFileType } from '@/api/asset_interfaces';
import { useState } from 'react';
import { Button } from '@/components/ui/buttons';

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

const InteractiveLoadingWrapper = () => {
  const [pillContainers, setPillContainers] = useState([...mockReasoningMessage.pill_containers!]);

  const addNewContainer = () => {
    const newContainer = {
      title: `Container ${pillContainers.length + 1}`,
      pills: [
        {
          text: `Term ${Math.random().toString(36).slice(2, 7)}`,
          type: 'term' as ThoughtFileType,
          id: Math.random().toString()
        },
        {
          text: `Term ${Math.random().toString(36).slice(2, 7)}`,
          type: 'term' as ThoughtFileType,
          id: Math.random().toString()
        }
      ]
    };
    setPillContainers([...pillContainers, newContainer]);
  };

  const message: BusterChatMessageReasoning_pills = {
    ...mockReasoningMessage,
    status: 'loading',
    pill_containers: pillContainers
  };

  return (
    <div className="flex flex-col gap-4">
      <Button onClick={addNewContainer} variant="default">
        Add New Container
      </Button>
      <ReasoningMessage_PillsContainer
        reasoningMessage={message}
        isCompletedStream={false}
        isLastMessageItem={true}
        chatId="123"
      />
    </div>
  );
};

export const Loading: Story = {
  render: () => <InteractiveLoadingWrapper />
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
