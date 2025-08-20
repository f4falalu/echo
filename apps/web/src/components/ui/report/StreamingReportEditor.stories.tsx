import type { Meta, StoryObj } from '@storybook/nextjs';
import type { ReportElementsWithIds, ReportElementWithId } from '@buster/server-shared/reports';
import { ReportEditor } from './ReportEditor';
import { useState, useEffect } from 'react';

// StreamingContentExample component that demonstrates streaming capabilities
const StreamingContentExample: React.FC<{
  isStreaming?: boolean;
  initialContent?: ReportElementsWithIds;
  streamingDelay?: number;
  className?: string;
}> = ({ isStreaming = false, initialContent = [], streamingDelay = 1000, className }) => {
  const [content, setContent] = useState<ReportElementsWithIds>(initialContent);
  const [isStreamingActive, setIsStreamingActive] = useState(isStreaming);

  // Simulate streaming content updates
  useEffect(() => {
    if (!isStreamingActive) return;

    const streamingContent: ReportElementsWithIds = [
      {
        id: '1',
        type: 'p',
        children: [{ text: 'This is a streaming report that updates in real-time.' }]
      },
      {
        id: '2',
        type: 'p',
        children: [{ text: 'The content is being generated dynamically as you watch.' }]
      },
      {
        id: '3',
        type: 'p',
        children: [
          { text: 'Each paragraph appears with a slight delay to simulate AI generation.' }
        ]
      },
      {
        id: '4',
        type: 'p',
        children: [{ text: 'This demonstrates the streaming capabilities of the report editor.' }]
      },
      {
        id: '5',
        type: 'p',
        children: [{ text: 'The editor remains responsive and updates smoothly.' }]
      }
    ];

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < streamingContent.length) {
        setContent((prev) => [...prev, streamingContent[currentIndex]]);
        currentIndex++;
      } else {
        setIsStreamingActive(false);
        clearInterval(interval);
      }
    }, streamingDelay);

    return () => clearInterval(interval);
  }, [isStreamingActive, streamingDelay]);

  const handleValueChange = (newContent: ReportElementsWithIds) => {
    if (!isStreamingActive) {
      setContent(newContent);
    }
  };

  return (
    <div className={className}>
      <ReportEditor
        value={content}
        placeholder="Start typing or watch streaming content..."
        readOnly={isStreamingActive}
        isStreaming={isStreamingActive}
        onValueChange={handleValueChange}
        className="min-h-[400px] w-full max-w-4xl"
      />
    </div>
  );
};

const meta: Meta<typeof StreamingContentExample> = {
  title: 'UI/Report/StreamingReportEditor',
  component: StreamingContentExample,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A rich text editor with streaming content capabilities for real-time content updates.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    isStreaming: {
      control: 'boolean',
      description: 'Whether the editor is in streaming mode'
    },
    streamingDelay: {
      control: { type: 'number', min: 100, max: 3000, step: 100 },
      description: 'Delay between streaming content updates (ms)'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story showing the basic editor
export const Default: Story = {
  args: {
    isStreaming: false,
    streamingDelay: 1000
  }
};

// Story for intelligent content streaming
export const IntelligentContentStreaming: Story = {
  args: {
    isStreaming: true,
    streamingDelay: 800
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates streaming content with ID-based replacement for dynamic updates.'
      }
    }
  }
};

// Story for custom value streaming
export const CustomValueStreaming: Story = {
  args: {
    isStreaming: true,
    streamingDelay: 500,
    initialContent: [
      {
        id: 'pre-existing',
        type: 'p',
        children: [{ text: 'This content was here before streaming began.' }]
      }
    ]
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows streaming of pre-formatted Value content with intelligent appending.'
      }
    }
  }
};

// Story for simple intelligent test
export const SimpleIntelligentTest: Story = {
  args: {
    isStreaming: true,
    streamingDelay: 300
  },
  parameters: {
    docs: {
      description: {
        story: 'Basic test of intelligent replacement with multiple updates to the same content.'
      }
    }
  }
};

// Story for realistic full test
export const RealisticFullTest: Story = {
  args: {
    isStreaming: true,
    streamingDelay: 1200,
    initialContent: [
      { id: 'intro', type: 'p', children: [{ text: 'Welcome to this comprehensive report.' }] }
    ]
  },
  parameters: {
    docs: {
      description: {
        story: 'Simulates realistic streaming scenarios with multiple paragraphs and updates.'
      }
    }
  }
};

// Story for stream full test
export const StreamFullTest: Story = {
  args: {
    isStreaming: true,
    streamingDelay: 600
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates efficient length-based updates for complete document state management.'
      }
    }
  }
};

// Story showing the editor in a cleared state
export const ClearedEditor: Story = {
  args: {
    isStreaming: false,
    initialContent: []
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the editor in its initial cleared state ready for new content.'
      }
    }
  }
};
