import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { ReasoningMessage_File } from './ReasoningMessage_File';
import { BusterChatMessageReasoning_file } from '@/api/asset_interfaces';
import { Button } from '@/components/ui/buttons';

const meta: Meta<typeof ReasoningMessage_File> = {
  title: 'Controllers/ReasoningController/ReasoningMessage_File',
  component: ReasoningMessage_File,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof ReasoningMessage_File>;

// Create a mock reasoning message
const createMockReasoningFile = (
  overrides: Partial<BusterChatMessageReasoning_file> = {}
): BusterChatMessageReasoning_file => {
  return {
    id: 'file-123',
    type: 'file',
    file_type: 'reasoning',
    file_name: 'example.js',
    version_number: 1,
    version_id: 'version-123',
    status: 'completed',
    file: [
      { line_number: 1, text: 'function example() {' },
      { line_number: 2, text: '  console.log("Hello, world!");' },
      { line_number: 3, text: '  return true;' },
      { line_number: 4, text: '}' }
    ],
    ...overrides
  };
};

export const Default: Story = {
  args: {
    reasoningMessage: createMockReasoningFile(),
    isCompletedStream: true,
    isLastMessageItem: false,
    chatId: 'chat-123'
  }
};

export const Loading: Story = {
  render: () => {
    const [lines, setLines] = React.useState([
      { line_number: 1, text: 'function example() {' },
      { line_number: 2, text: '  console.log("Hello, world!");' }
    ]);

    const addLine = () => {
      const nextLineNumber = lines.length + 1;
      const newLine = {
        line_number: nextLineNumber,
        text: nextLineNumber === 3 ? '  return true;' : '}'
      };
      setLines([...lines, newLine]);
    };

    return (
      <div className="flex flex-col gap-4">
        <Button onClick={addLine}>Add Next Line</Button>

        <ReasoningMessage_File
          reasoningMessage={{
            ...createMockReasoningFile({
              status: 'loading',
              file: lines
            })
          }}
          isCompletedStream={false}
          isLastMessageItem={true}
          chatId="chat-123"
        />
      </div>
    );
  }
};

export const Failed: Story = {
  args: {
    reasoningMessage: createMockReasoningFile({
      status: 'failed'
    }),
    isCompletedStream: true,
    isLastMessageItem: false,
    chatId: 'chat-123'
  }
};

export const LongFile: Story = {
  args: {
    reasoningMessage: createMockReasoningFile({
      file_name: 'longExample.js',
      file: Array.from({ length: 20 }, (_, i) => ({
        line_number: i + 1,
        text:
          i === 0
            ? 'function longExample() {'
            : i === 19
              ? '}'
              : `  // This is line ${i + 1} of the example file with some code that demonstrates syntax highlighting`
      }))
    }),
    isCompletedStream: true,
    isLastMessageItem: false,
    chatId: 'chat-123'
  }
};

export const DifferentFileType: Story = {
  args: {
    reasoningMessage: createMockReasoningFile({
      file_type: 'metric',
      file_name: 'metrics.json',
      file: [
        { line_number: 1, text: '{' },
        { line_number: 2, text: '  "name": "Example Metric",' },
        { line_number: 3, text: '  "value": 42,' },
        { line_number: 4, text: '  "unit": "count"' },
        { line_number: 5, text: '}' }
      ]
    }),
    isCompletedStream: true,
    isLastMessageItem: false,
    chatId: 'chat-123'
  }
};
