import type { Meta, StoryObj } from '@storybook/nextjs';
import type { ReportElementsWithIds, ReportElementWithId } from '@buster/server-shared/reports';
import { ReportEditor } from './ReportEditor';
import { useState, useEffect } from 'react';
import { Button } from '../buttons/Button';

// StreamingContentExample component that demonstrates streaming capabilities
const StreamingContentExample: React.FC<{
  isStreaming?: boolean;
  initialContent?: ReportElementsWithIds;
  streamingDelay?: number;
  className?: string;
  showStreamingButton?: boolean;
  batchSize?: number;
}> = ({
  isStreaming = false,
  initialContent = [],
  streamingDelay = 1000,
  className,
  showStreamingButton = false,
  batchSize = 1
}) => {
  const [content, setContent] = useState<ReportElementsWithIds>(initialContent);
  const [isStreamingActive, setIsStreamingActive] = useState(isStreaming);

  // Simulate streaming content updates
  useEffect(() => {
    if (!isStreamingActive) return;

    const streamingContent: ReportElementsWithIds = [
      {
        id: 'id-1',
        type: 'p',
        children: [{ text: 'This is a streaming report that updates in real-time.' }]
      },
      {
        id: 'id-2',
        type: 'p',
        children: [{ text: 'The content is being generated dynamically as you watch.' }]
      },
      {
        id: 'id-3',
        type: 'p',
        children: [
          { text: 'Each paragraph appears with a slight delay to simulate AI generation.' }
        ]
      },
      {
        id: 'id-4',
        type: 'p',
        children: [{ text: 'This demonstrates the streaming capabilities of the report editor.' }]
      },
      {
        id: 'id-5',
        type: 'p',
        children: [{ text: 'The editor remains responsive and updates smoothly.' }]
      },
      {
        id: 'id-6',
        type: 'p',
        children: [{ text: 'Batch streaming allows multiple items to be added at once.' }]
      },
      {
        id: 'id-7',
        type: 'p',
        children: [{ text: 'This creates a more efficient streaming experience.' }]
      },
      {
        id: 'id-8',
        type: 'p',
        children: [{ text: 'Perfect for scenarios where content comes in chunks.' }]
      }
    ];

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < streamingContent.length) {
        // Add batchSize number of items at once
        const itemsToAdd = streamingContent.slice(currentIndex, currentIndex + batchSize);
        setContent((prev) => [...prev, ...itemsToAdd]);
        currentIndex += batchSize;
      } else {
        setIsStreamingActive(false);
        clearInterval(interval);
      }
    }, streamingDelay);

    return () => clearInterval(interval);
  }, [isStreamingActive, streamingDelay, batchSize]);

  const handleValueChange = (newContent: ReportElementsWithIds) => {
    if (!isStreamingActive) {
      setContent(newContent);
    }
  };

  const handleStartStreaming = () => {
    setIsStreamingActive(true);
  };

  const handleReset = () => {
    setIsStreamingActive(false);
    setContent(initialContent);
  };

  return (
    <div className={'report-editor h-full w-full rounded border p-3'}>
      {showStreamingButton && (
        <div className="mb-4 flex gap-2">
          <Button onClick={handleStartStreaming} disabled={isStreamingActive} variant="default">
            Start Streaming
          </Button>
          <Button onClick={handleReset} variant="outlined">
            Reset
          </Button>
        </div>
      )}
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
    layout: 'fullscreen',
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
    },
    showStreamingButton: {
      control: 'boolean',
      description: 'Whether to show the streaming control buttons'
    },
    batchSize: {
      control: { type: 'number', min: 1, max: 5, step: 1 },
      description: 'Number of items to add at once during streaming'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story showing the basic editor
export const Default: Story = {
  args: {
    isStreaming: false,
    streamingDelay: 1000,
    showStreamingButton: true
  }
};

// New story that appends 2 items at a time
export const BatchStreaming: Story = {
  args: {
    isStreaming: false,
    streamingDelay: 1500,
    showStreamingButton: true,
    batchSize: 2
  }
};

// Story with lots of content to demonstrate scrolling
export const LongContentScrolling: Story = {
  args: {
    isStreaming: false,
    streamingDelay: 300,
    showStreamingButton: true,
    batchSize: 1
  },
  render: (args) => {
    const [content, setContent] = useState<ReportElementsWithIds>([]);
    const [isStreamingActive, setIsStreamingActive] = useState(false);
    const [iterationCount, setIterationCount] = useState(0);

    // Generate a large amount of content for scrolling demonstration
    const generateLongContent = (): ReportElementsWithIds => {
      const longContent: ReportElementsWithIds = [];

      // Generate 50 paragraphs with varied content
      for (let i = 1; i <= 50; i++) {
        const paragraphContent = [
          `This is paragraph ${i} of a very long document designed to test scrolling functionality. `,
          `The content is being streamed in real-time to demonstrate how the editor handles large amounts of text. `,
          `Each paragraph contains multiple sentences to create substantial content that will require scrolling. `,
          `As more content is added, you should see the editor automatically scroll to show the latest additions. `,
          `This helps ensure that users can always see the most recent content as it's being generated.`
        ].join('');

        longContent.push({
          id: `long-content-${i}`,
          type: 'p',
          children: [{ text: paragraphContent }]
        });
      }

      return longContent;
    };

    const longContent = generateLongContent();

    useEffect(() => {
      if (!isStreamingActive) return;

      const interval = setInterval(() => {
        setIterationCount((prev) => {
          const newCount = prev + 1;

          if (newCount <= longContent.length) {
            setContent((prevContent) => {
              // Add the next paragraph from our long content
              return [...prevContent, longContent[newCount - 1]];
            });
          } else {
            setIsStreamingActive(false);
            clearInterval(interval);
          }

          return newCount;
        });
      }, args.streamingDelay);

      return () => clearInterval(interval);
    }, [isStreamingActive, args.streamingDelay, longContent]);

    const handleValueChange = (newContent: ReportElementsWithIds) => {
      if (!isStreamingActive) {
        setContent(newContent);
      }
    };

    const handleStartStreaming = () => {
      setIsStreamingActive(true);
      setIterationCount(0);
      setContent([]);
    };

    const handleReset = () => {
      setIsStreamingActive(false);
      setIterationCount(0);
      setContent([]);
    };

    return (
      <div className={'report-editor h-full w-full rounded border p-3'}>
        <div className="mb-4 flex gap-2">
          <Button onClick={handleStartStreaming} disabled={isStreamingActive} variant="default">
            Start Long Content Streaming
          </Button>
          <Button onClick={handleReset} variant="outlined">
            Reset
          </Button>
        </div>
        <div className="mb-2 text-sm text-gray-600">
          Paragraphs added: {iterationCount} / {longContent.length}
        </div>
        <div className="mb-2 text-sm text-gray-600">Total content: {content.length} paragraphs</div>
        <ReportEditor
          value={content}
          placeholder="Watch as 50 paragraphs are streamed in real-time..."
          readOnly={isStreamingActive}
          isStreaming={isStreamingActive}
          onValueChange={handleValueChange}
          className="min-h-[600px] w-full max-w-4xl"
        />
      </div>
    );
  }
};

// New story that appends text to existing nodes
export const AppendToExisting: Story = {
  args: {
    isStreaming: false,
    streamingDelay: 500,
    showStreamingButton: true,
    batchSize: 1
  },
  render: (args) => {
    const [content, setContent] = useState<ReportElementsWithIds>([
      {
        id: 'id-1',
        type: 'p',
        children: [{ text: '' }]
      }
    ]);
    const [isStreamingActive, setIsStreamingActive] = useState(false);
    const [iterationCount, setIterationCount] = useState(0);

    // Text chunks to append
    // A paragraph about the author of Red Rising, split into small chunks (4-8 words each)
    const textChunks = [
      'Pierce Brown is the author',
      'of the Red Rising series.',
      'He grew up in Colorado,',
      'fascinated by science fiction worlds.',
      'After college, he worked many jobs,',
      'before turning to writing full-time.',
      'Red Rising debuted in 2014, ',
      'earning praise for its storytelling.',
      'Brown’s books explore rebellion and identity,',
      'with vivid prose and complex characters.',
      'He continues to expand the universe,',
      'captivating readers with each new book.'
    ];

    useEffect(() => {
      if (!isStreamingActive) return;

      const interval = setInterval(() => {
        setIterationCount((prev) => {
          const newCount = prev + 1;

          if (newCount <= textChunks.length) {
            setContent((prevContent) => {
              const newContent = [...prevContent];

              if (newCount <= 6) {
                // First 6 iterations: append to the first paragraph
                const firstParagraph = newContent[0];
                if (
                  firstParagraph &&
                  firstParagraph.children[0] &&
                  'text' in firstParagraph.children[0]
                ) {
                  const currentText = (firstParagraph.children[0] as { text: string }).text || '';
                  firstParagraph.children[0] = {
                    ...firstParagraph.children[0],
                    text: currentText + textChunks[newCount - 1] + ' '
                  } as { text: string };
                }
              } else {
                // After 6 iterations: start appending to the second paragraph
                if (newContent.length === 1) {
                  // Create second paragraph
                  newContent.push({
                    id: 'id-2',
                    type: 'p',
                    children: [{ text: textChunks[newCount - 1] }]
                  });
                } else {
                  // Append to second paragraph
                  const secondParagraph = newContent[1];
                  if (
                    secondParagraph &&
                    secondParagraph.children[0] &&
                    'text' in secondParagraph.children[0]
                  ) {
                    const currentText =
                      (secondParagraph.children[0] as { text: string }).text || '';
                    secondParagraph.children[0] = {
                      ...secondParagraph.children[0],
                      text: currentText + textChunks[newCount - 1] + ' '
                    } as { text: string };
                  }
                }
              }

              return newContent;
            });
          } else {
            setIsStreamingActive(false);
            clearInterval(interval);
          }

          return newCount;
        });
      }, args.streamingDelay);

      return () => clearInterval(interval);
    }, [isStreamingActive, args.streamingDelay]);

    const handleValueChange = (newContent: ReportElementsWithIds) => {
      if (!isStreamingActive) {
        setContent(newContent);
      }
    };

    const handleStartStreaming = () => {
      setIsStreamingActive(true);
      setIterationCount(0);
    };

    const handleReset = () => {
      setIsStreamingActive(false);
      setIterationCount(0);
      setContent([
        {
          id: 'id-1',
          type: 'p',
          children: [{ text: '' }]
        }
      ]);
    };

    return (
      <div className={'report-editor h-full w-full rounded border p-3'}>
        <div className="mb-4 flex gap-2">
          <Button onClick={handleStartStreaming} disabled={isStreamingActive} variant="default">
            Start Streaming
          </Button>
          <Button onClick={handleReset} variant="outlined">
            Reset
          </Button>
        </div>
        <div className="mb-2 text-sm text-gray-600">
          Iteration: {iterationCount} / {textChunks.length}
        </div>
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
  }
};
