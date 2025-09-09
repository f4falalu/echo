import type { Meta, StoryObj } from '@storybook/react-vite';
import type * as React from 'react';
import { useLLMStreaming } from './useLLMStreaming';
import { useStreamTokenArray } from './useStreamTokenArray';

// Simple token stream to exercise throttling + read-ahead
const demoTokens: Array<{ token: string; delayMs: number }> = [
  { token: '## Streaming Throttle Hook Test\n\n', delayMs: 300 },
  { token: 'This demo shows throttled output vs. raw streamed content. ', delayMs: 300 },
  // A huge block of text here (like 200 chars)
  // This token simulates a long markdown paragraph to test throttling and markdown boundary safety.
  {
    token:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' +
      'Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. ' +
      'Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. ' +
      'Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. ' +
      'Duis semper. Duis arcu massa, scelerisque vitae, consequat in, pretium a, enim. Pellentesque congue. ' +
      'Ut in risus volutpat libero pharetra tempor. Cras vestibulum bibendum augue. Praesent egestas leo in pede. ' +
      'Praesent blandit odio eu enim. Pellentesque sed dui ut augue blandit sodales. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Aliquam nibh. Mauris ac mauris sed pede pellentesque fermentum. ' +
      'Maecenas adipiscing ante non diam sodales hendrerit.\n\n',
    delayMs: 100,
  },
  {
    token:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' +
      'Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. ' +
      'Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. ' +
      'Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. ' +
      'Duis semper. Duis arcu massa, scelerisque vitae, consequat in, pretium a, enim. Pellentesque congue. ' +
      'Ut in risus volutpat libero pharetra tempor. Cras vestibulum bibendum augue. Praesent egestas leo in pede. ' +
      'Praesent blandit odio eu enim. Pellentesque sed dui ut augue blandit sodales. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Aliquam nibh. Mauris ac mauris sed pede pellentesque fermentum. ' +
      'Maecenas adipiscing ante non diam sodales hendrerit.\n\n',
    delayMs: 1000,
  },
  { token: 'It also tests inline code like `useEffect` and fences.\n\n', delayMs: 500 },
  { token: '```ts\n', delayMs: 200 },
  { token: 'function greet(name: string) {\n', delayMs: 200 },
  { token: '  return `Hello, ${name}!`;\n}', delayMs: 600 },
  { token: '\n```\n\n', delayMs: 200 },
  { token: 'More prose follows after a small pause. ', delayMs: 800 },
  { token: 'Inline code split start: `br', delayMs: 300 },
  { token: 'ok', delayMs: 500 },
  { token: 'en_code` continues.\n\n', delayMs: 300 },
  { token: 'Final line.\n', delayMs: 400 },
];

type HookHarnessProps = {
  // Map through to hook config so we can tweak live in Storybook controls
  readAheadChars: number;
  readAheadMaxMs: number;
  minChunkChars: number;
  maxChunkChars: number;
  targetBufferChars: number;
  frameLookBackMs: number;
  adjustPercentage: number;
  markdownSafeBoundaries: boolean;
  flushImmediatelyOnComplete: boolean;
};

const HookHarness: React.FC<HookHarnessProps> = (args) => {
  // Simulate incoming streamed content
  const { throttledContent: output, isDone: isStreamFinished } = useStreamTokenArray({
    tokens: demoTokens,
    isStreamFinished: false,
  });

  // Apply the throttling + read-ahead hook
  const { throttledContent, isDone, flushNow, reset } = useLLMStreaming({
    content: output,
    isStreamFinished,
    readAheadChars: args.readAheadChars,
    readAheadMaxMs: args.readAheadMaxMs,
    minChunkChars: args.minChunkChars,
    maxChunkChars: args.maxChunkChars,
    targetBufferChars: args.targetBufferChars,
    frameLookBackMs: args.frameLookBackMs,
    adjustPercentage: args.adjustPercentage,
    markdownSafeBoundaries: args.markdownSafeBoundaries,
    flushImmediatelyOnComplete: args.flushImmediatelyOnComplete,
  });

  return (
    <div className="flex h-full w-full gap-4">
      <div className="w-1/2 rounded-md border p-3">
        <div className="flex space-x-3">
          <div className="mb-2 text-sm font-semibold">Throttled Output</div>
          <div className="mb-2 text-xs text-gray-600">
            status: {isDone ? '✅ done' : isStreamFinished ? 'draining…' : 'streaming…'} • len:{' '}
            {throttledContent.length}
          </div>
          <div className="mb-2 flex gap-2">
            <button type="button" className="rounded border px-2 py-1 text-xs" onClick={flushNow}>
              Flush Now
            </button>
            <button type="button" className="rounded border px-2 py-1 text-xs" onClick={reset}>
              Reset
            </button>
          </div>
        </div>
        <pre className="max-h-[400px] overflow-auto text-sm whitespace-pre-wrap">
          {throttledContent}
        </pre>
      </div>
      <div className="w-1/2 rounded-md border p-3">
        <div className="mb-2 text-sm font-semibold">Raw Stream</div>
        <div className="mb-2 text-xs text-gray-600">
          status: {isStreamFinished ? '✅ complete' : '⏳ streaming…'} • len: {output.length}
        </div>
        <pre className="max-h-[400px] overflow-auto text-sm whitespace-pre-wrap">{output}</pre>
      </div>
    </div>
  );
};

const meta: Meta<typeof HookHarness> = {
  title: 'UI/Typography/AppMarkdownStreaming/useLLMStreaming',
  component: HookHarness,
  args: {
    readAheadChars: 6,
    readAheadMaxMs: 200,
    minChunkChars: 4,
    maxChunkChars: 56,
    targetBufferChars: 24,
    frameLookBackMs: 33,
    adjustPercentage: 0.35,
    markdownSafeBoundaries: true,
    flushImmediatelyOnComplete: true,
  },
  argTypes: {
    readAheadChars: { control: { type: 'number', min: 0, max: 32, step: 1 } },
    readAheadMaxMs: { control: { type: 'number', min: 0, max: 1000, step: 25 } },
    minChunkChars: { control: { type: 'number', min: 1, max: 64, step: 1 } },
    maxChunkChars: { control: { type: 'number', min: 8, max: 256, step: 1 } },
    targetBufferChars: { control: { type: 'number', min: 0, max: 128, step: 1 } },
    frameLookBackMs: { control: { type: 'number', min: 8, max: 100, step: 1 } },
    adjustPercentage: { control: { type: 'number', min: 0, max: 1, step: 0.05 } },
    markdownSafeBoundaries: { control: { type: 'boolean' } },
    flushImmediatelyOnComplete: { control: { type: 'boolean' } },
  },
};

export default meta;
type Story = StoryObj<typeof HookHarness>;

export const Default: Story = {
  render: (args) => <HookHarness {...args} />,
};
