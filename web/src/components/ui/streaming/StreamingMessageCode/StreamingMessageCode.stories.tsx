import type { Meta, StoryObj } from '@storybook/react';
import { StreamingMessageCode } from './StreamingMessageCode';
import type { FileType } from '@/api/asset_interfaces';
import { Button } from '@/components/ui/buttons';
import { fn } from '@storybook/test';
import React from 'react';

const meta: Meta<typeof StreamingMessageCode> = {
  title: 'UI/streaming/StreamingMessageCode',
  component: StreamingMessageCode,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof StreamingMessageCode>;

const sampleYaml = `apiVersion: v1
kind: ConfigMap
metadata:
  name: my-config
data:
  key1: value1
  key2: value2
`;

const baseProps = {
  file_name: 'config.yaml',
  version_number: 1,
  file_type: 'reasoning' as FileType,
  version_id: '123'
};

export const Default: Story = {
  args: {
    ...baseProps,
    status: 'completed',
    isCompletedStream: true,
    file: {
      text: sampleYaml,
      modified: []
    }
  }
};

export const WithHiddenLines: Story = {
  args: {
    ...baseProps,
    status: 'completed',
    isCompletedStream: true,
    file: {
      text: sampleYaml,
      modified: [[2, 4]] // This will hide lines 2-4
    }
  }
};

export const Loading: Story = {
  args: {
    ...baseProps,
    status: 'loading',
    isCompletedStream: false,
    file: {
      text: sampleYaml,
      modified: []
    }
  }
};

export const WithButtons: Story = {
  args: {
    ...baseProps,
    status: 'completed',
    isCompletedStream: true,
    file: {
      text: sampleYaml,
      modified: []
    },
    buttons: (
      <div className="flex gap-2">
        <button className="rounded bg-blue-500 px-3 py-1 text-white">Action 1</button>
        <button className="rounded bg-green-500 px-3 py-1 text-white">Action 2</button>
      </div>
    )
  }
};

// Interactive story with streaming content
const streamingContent = [
  'apiVersion: v1',
  'kind: ConfigMap',
  'metadata:',
  '  name: my-config',
  'data:',
  '  key1: value1',
  '  key2: value2'
];

export const InteractiveStreaming: Story = {
  args: {
    ...baseProps,
    status: 'completed',
    isCompletedStream: false,
    file: {
      text: streamingContent.slice(0, 3).join('\n'),
      modified: []
    }
  },
  render: (args) => {
    const [currentLines, setCurrentLines] = React.useState(3);
    const [isStreaming, setIsStreaming] = React.useState(false);

    const handleStreamClick = () => {
      setIsStreaming(true);
      const interval = setInterval(() => {
        setCurrentLines((prev) => {
          if (prev >= streamingContent.length) {
            clearInterval(interval);
            setIsStreaming(false);
            return prev;
          }
          return prev + 1;
        });
      }, 500);
    };

    return (
      <div className="space-y-4">
        <StreamingMessageCode
          {...args}
          isCompletedStream={!isStreaming}
          file={{
            text: streamingContent.slice(0, currentLines).join('\n'),
            modified: []
          }}
        />
        <div className="flex justify-center">
          <Button
            onClick={handleStreamClick}
            disabled={isStreaming || currentLines >= streamingContent.length}>
            {isStreaming ? 'Streaming...' : 'Start Streaming'}
          </Button>
        </div>
      </div>
    );
  }
};
