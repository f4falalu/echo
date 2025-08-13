import type { Meta, StoryObj } from '@storybook/nextjs';
import * as React from 'react';
import { useStreamTokenArray } from './useStreamTokenArray';

/**
 * Demo component that showcases the useStreamTokenArray hook
 */
const StreamTokenArrayDemo = ({
  tokens,
  isStreamFinished,
  ...hookProps
}: {
  tokens: string[];
  isStreamFinished: boolean;
  targetBufferTokens?: number;
  minChunkTokens?: number;
  maxChunkTokens?: number;
  frameLookBackMs?: number;
  adjustPercentage?: number;
  flushImmediatelyOnComplete?: boolean;
  tokenSeparator?: string;
}) => {
  const [currentTokens, setCurrentTokens] = React.useState<string[]>([]);
  const [finished, setFinished] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const autoStream = true;
  const streamDelay = 300;

  // Auto-streaming simulation
  React.useEffect(() => {
    if (!autoStream) return;

    setCurrentTokens([]);
    setFinished(false);
    let index = 0;

    const streamNextToken = () => {
      if (index < tokens.length) {
        setCurrentTokens((prev) => [...prev, tokens[index]]);
        index++;
        timeoutRef.current = setTimeout(streamNextToken, streamDelay);
      } else {
        setFinished(true);
      }
    };

    timeoutRef.current = setTimeout(streamNextToken, streamDelay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [tokens, autoStream, streamDelay]);

  const { throttledTokens, throttledContent, isDone, flushNow, reset } = useStreamTokenArray({
    tokens: (autoStream ? currentTokens : tokens).map(t => ({ token: t, delayMs: 0 })),
    isStreamFinished: autoStream ? finished : isStreamFinished,
    ...hookProps
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-4 text-lg font-semibold">Stream Token Array Demo</h3>

        {/* Controls */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={flushNow}
            className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600">
            Flush Now
          </button>
          <button
            onClick={() => {
              reset();
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
              }
              setCurrentTokens([]);
              setFinished(false);
            }}
            className="rounded bg-gray-500 px-3 py-1 text-sm text-white hover:bg-gray-600">
            Reset
          </button>
        </div>

        {/* Status */}
        <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Total Tokens:</span>{' '}
            {autoStream ? currentTokens.length : tokens.length}
          </div>
          <div>
            <span className="font-medium">Visible Tokens:</span> {throttledTokens.length}
          </div>
          <div>
            <span className="font-medium">Stream Finished:</span>{' '}
            {autoStream ? (finished ? 'Yes' : 'No') : isStreamFinished ? 'Yes' : 'No'}
          </div>
          <div>
            <span className="font-medium">Is Done:</span> {isDone ? 'Yes' : 'No'}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>
              {throttledTokens.length} / {autoStream ? currentTokens.length : tokens.length}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-blue-500 transition-all duration-200"
              style={{
                width: `${(throttledTokens.length / Math.max(1, autoStream ? currentTokens.length : tokens.length)) * 100}%`
              }}
            />
          </div>
        </div>

        {/* Token Array Visualization */}
        <div className="mb-4">
          <h4 className="mb-2 font-medium">Token Array:</h4>
          <div className="flex flex-wrap gap-1 rounded border bg-gray-50 p-3">
            {(autoStream ? currentTokens : tokens).map((token, index) => (
              <span
                key={index}
                className={`rounded border px-2 py-1 text-sm ${
                  index < throttledTokens.length
                    ? 'border-green-300 bg-green-100 text-green-800'
                    : 'border-gray-300 bg-gray-100 text-gray-500'
                }`}>
                {token}
              </span>
            ))}
          </div>
        </div>

        {/* Content Output */}
        <div>
          <h4 className="mb-2 font-medium">Rendered Content:</h4>
          <div className="min-h-[100px] rounded border bg-gray-50 p-4 whitespace-pre-wrap">
            {throttledContent || <span className="text-gray-400 italic">No content yet...</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

const meta: Meta<typeof StreamTokenArrayDemo> = {
  title: 'UI/streaming/useStreamTokenArray',
  component: StreamTokenArrayDemo,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The \`useStreamTokenArray\` hook provides progressive revelation of token arrays with configurable pacing.
Unlike character-based streaming, this hook works with discrete tokens (words, sentences, etc.) and reveals
them in chunks with smooth animation frame-based timing.

## Features

- **Token-based streaming**: Works with arrays of discrete tokens
- **Configurable pacing**: Control timing, chunk sizes, and buffering
- **Dual output**: Returns both token array and joined string
- **Performance optimized**: Uses RAF loop and refs to minimize re-renders
- **Auto-flush**: Optionally flush remaining tokens when stream finishes

## Use Cases

- Word-by-word text revelation
- Sentence-by-sentence content display  
- Progressive list building
- Chat message token streaming
- Any scenario requiring discrete unit streaming
        `
      }
    }
  }
};

export default meta;

type Story = StoryObj<typeof StreamTokenArrayDemo>;

/**
 * Basic word-by-word streaming example with default settings.
 */
export const Default: Story = {
  args: {
    tokens: [
      'Hello',
      'world!',
      'This',
      'is',
      'a',
      'demonstration',
      'of',
      'the',
      'useStreamTokenArray',
      'hook',
      'streaming',
      'tokens',
      'progressively.',
      'Each',
      'word',
      'appears',
      'with',
      'controlled',
      'timing',
      'and',
      'pacing.'
    ],
    isStreamFinished: false
  }
};

/**
 * Fast streaming with small chunks for rapid token revelation.
 */
export const FastStreaming: Story = {
  args: {
    tokens: [
      'Quick',
      'fast',
      'streaming',
      'with',
      'minimal',
      'delay',
      'between',
      'tokens',
      'for',
      'a',
      'more',
      'rapid',
      'revelation',
      'effect.'
    ],
    isStreamFinished: false,
    targetBufferTokens: 1,
    minChunkTokens: 1,
    maxChunkTokens: 2,
    frameLookBackMs: 50
  }
};

/**
 * Sentence-by-sentence streaming with periods as separators.
 */
export const SentenceStreaming: Story = {
  args: {
    tokens: [
      'This is the first sentence.',
      'Here comes the second sentence with more content.',
      'The third sentence demonstrates longer text streaming.',
      'Finally, this is the last sentence in our example.'
    ],
    isStreamFinished: false,
    targetBufferTokens: 0,
    minChunkTokens: 1,
    maxChunkTokens: 1,
    frameLookBackMs: 150,
    tokenSeparator: '\n\n'
  }
};

/**
 * Manual control without auto-streaming for testing.
 */
export const ManualControl: Story = {
  args: {
    tokens: [
      'This',
      'example',
      'does',
      'not',
      'auto-stream.',
      'Use',
      'the',
      'controls',
      'to',
      'test',
      'flush',
      'and',
      'reset',
      'functionality.'
    ],
    isStreamFinished: true
  }
};
