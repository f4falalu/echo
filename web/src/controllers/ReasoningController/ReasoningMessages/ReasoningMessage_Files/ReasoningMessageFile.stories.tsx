import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { ReasoningMessage_File, ReasoningMessageFileProps } from './ReasoningMessageFile';
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
  overrides: Partial<ReasoningMessageFileProps> = {}
): ReasoningMessageFileProps => {
  return {
    id: 'file-123',
    chatId: 'chat-123',
    isCompletedStream: false,
    file_type: 'metric',
    file_name: 'example.ts',
    version_number: 1,
    version_id: 'v1',
    status: 'completed',
    file: {
      text: 'console.test("Hello World") \nconsole.test("Hello World") \nconsole.test("Hello World") \n',
      modified: [[1, 1]]
    },
    ...overrides
  };
};

export const Default: Story = {
  args: {
    ...createMockReasoningFile(),
    isCompletedStream: true,
    chatId: 'chat-123'
  }
};

export const Loading: Story = {
  render: () => {
    const [text, setText] = React.useState(
      'function example() {\n  console.test("Hello, world!");\n'
    );

    const addLine = () => {
      setText((prev) => prev + (prev.endsWith('}') ? '' : '  return true;\n}\n'));
    };

    return (
      <div className="flex flex-col gap-4">
        <Button onClick={addLine}>Add Next Line</Button>

        <ReasoningMessage_File
          {...createMockReasoningFile({
            status: 'loading',
            file: {
              text,
              text_chunk: text
            }
          })}
          isCompletedStream={false}
          chatId="chat-123"
        />
      </div>
    );
  }
};

export const Failed: Story = {
  args: {
    ...createMockReasoningFile({
      status: 'failed'
    }),
    isCompletedStream: true,
    chatId: 'chat-123'
  }
};

export const LongFile: Story = {
  args: {
    ...createMockReasoningFile({
      file_name: 'longExample.js',
      file: {
        text: Array.from({ length: 20 }, (_, i) =>
          i === 0
            ? 'function longExample() {'
            : i === 19
              ? '}'
              : `  // This is line ${i + 1} of the example file with some code that demonstrates syntax highlighting`
        ).join('\n')
      }
    }),
    isCompletedStream: true,
    chatId: 'chat-123'
  }
};

export const DifferentFileType: Story = {
  args: {
    ...createMockReasoningFile({
      file_type: 'metric',
      file_name: 'metrics.json',
      file: {
        text: ['{', '  "name": "Example Metric",', '  "value": 42,', '  "unit": "count"', '}'].join(
          '\n'
        )
      }
    }),
    isCompletedStream: true,
    chatId: 'chat-123'
  }
};
