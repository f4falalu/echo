import type { Meta, StoryObj } from '@storybook/react';
import { useRef } from 'react';
import { Button } from '@/components/ui/buttons';
import { MessageAssumptions, type MessageAssumptionsRef } from './MessageAssumptions';
import type { PostProcessingMessage } from '@buster/server-shared/message';

const meta: Meta<typeof MessageAssumptions> = {
  title: 'Features/MessageAssumptions',
  component: MessageAssumptions,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof MessageAssumptions>;

// Story wrapper component to demonstrate imperative ref usage
const MessageAssumptionsDemo = ({
  assumptions
}: {
  assumptions: PostProcessingMessage['assumptions'];
}) => {
  const messageAssumptionsRef = useRef<MessageAssumptionsRef>(null);

  const handleOpen = () => {
    messageAssumptionsRef.current?.open();
  };

  const handleClose = () => {
    messageAssumptionsRef.current?.close();
  };

  const mockMessage: PostProcessingMessage = {
    summary_message: 'This is a summary message',
    summary_title: 'Summary',
    confidence_score: 'low',
    assumptions,
    tool_called: 'tool',
    user_name: 'user'
  };

  return (
    <div className="space-x-4">
      <Button onClick={handleOpen}>Open Message Assumptions</Button>
      <Button variant="outlined" onClick={handleClose}>
        Close Message Assumptions
      </Button>
      <MessageAssumptions ref={messageAssumptionsRef} {...mockMessage} />
    </div>
  );
};

export const Default: Story = {
  render: () => (
    <MessageAssumptionsDemo
      assumptions={[
        {
          classification: 'dataFormat',
          explanation: 'This is a major assumption',
          label: 'major',
          descriptive_title: 'Descriptive Title'
        },
        {
          classification: 'timePeriodGranularity',
          explanation: 'This is a minor assumption',
          label: 'minor',
          descriptive_title: 'Descriptive Title'
        },
        {
          classification: 'dataFormat',
          explanation: 'This is a minor assumption',
          label: 'minor',
          descriptive_title: 'Descriptive Title'
        },
        {
          classification: 'businessLogic',
          explanation: 'This is a minor assumption',
          label: 'minor',
          descriptive_title: 'Descriptive Title'
        },
        {
          classification: 'filtering',
          explanation: 'This is a minor assumption',
          label: 'minor',
          descriptive_title: 'Descriptive Title'
        },
        {
          classification: 'tableRelationship',
          explanation: 'This is a minor assumption',
          label: 'minor',
          descriptive_title: 'Descriptive Title'
        }
      ]}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'This story demonstrates the MessageAssumptions component with imperative ref controls. Use the buttons to open and close the sheet programmatically.'
      }
    }
  }
};

export const Empty: Story = {
  render: () => <MessageAssumptionsDemo assumptions={[]} />,
  parameters: {
    docs: {
      description: {
        story: 'This story demonstrates the MessageAssumptions component with empty assumptions.'
      }
    }
  }
};
