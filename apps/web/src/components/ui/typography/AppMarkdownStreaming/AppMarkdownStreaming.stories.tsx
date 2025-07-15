import React from 'react';
import AppMarkdownStreaming from './AppMarkdownStreaming';
import type { Meta, StoryObj } from '@storybook/react';
import { useStreamTokenArray } from '@llm-ui/react';
import type { MarkdownAnimation } from './AnimatedMarkdown/animation-helpers';

const meta: Meta<typeof AppMarkdownStreaming> = {
  title: 'UI/Typography/AppMarkdownStreaming',
  component: AppMarkdownStreaming
};
export default meta;

type Story = StoryObj<typeof AppMarkdownStreaming>;

const redRisingPoemTokenArray = [
  {
    token: '# TEST\n\n',
    delayMs: 1000
  },
  // {
  //   token: "## Red Rising: The Reaper's Code (Pierce Brown)\n\n",
  //   delayMs: 2500
  // },
  // {
  //   token: '\n\n## PAUSE (2 seconds)\n\n',
  //   delayMs: 2000
  // },
  {
    token:
      '```yaml\n' +
      'name: Red Rising\n' +
      'author: Pierce Brown\n' +
      'genre: Science Fiction\n' +
      'published: 2014\n' +
      'series:\n' +
      '  - title: Red Rising\n' +
      '    year: 2014\n' +
      '  - title: Golden Son\n' +
      '    year: 2015\n' +
      '  - title: Morning Star\n' +
      '    year: 2016\n' +
      'themes:\n' +
      '  - power\n' +
      '  - rebellion\n' +
      '  - identity\n' +
      '```\n\n',
    delayMs: 2000
  },
  {
    token:
      'Pierce Brown, the author of the *"Red Rising"* series, is a celebrated American science fiction writer known for his captivating storytelling and intricate world-building. Born on January 28, 1988, in Denver, Colorado, Brown developed a passion for writing at a young age, inspired by the works of **J.R.R. Tolkien** and **George R.R. Martin**. He pursued his education at *Pepperdine University*, where he honed his skills in political science and economics, which later influenced the complex socio-political landscapes in his novels. Brown\'s debut novel, *"Red Rising,"* published in 2014, quickly gained a dedicated following, praised for its gripping narrative and richly developed characters. The series, set in a dystopian future where society is divided by color-coded castes, explores themes of power, rebellion, and identity. Brown\'s ability to weave intense action with profound philosophical questions has earned him critical acclaim and a loyal fanbase. Beyond writing, Brown is known for his engaging presence on social media, where he interacts with fans and shares insights into his creative process. His work continues to resonate with readers worldwide, solidifying his place as a prominent voice in contemporary science fiction literature.',
    delayMs: 2000
  },
  {
    token: '\n\n## PAUSE (2 seconds)\n\n',
    delayMs: 2000
  },
  {
    token: '# PAUSE (1 second)\n\n',
    delayMs: 1000
  },
  {
    token: '## PAUSE 30 seconds\n\n',
    delayMs: 2000
  },
  {
    token: '## PAUSE 30 seconds\n\n',
    delayMs: 2000
  }
];

const StreamingDemo: React.FC<{ animation: MarkdownAnimation }> = ({ animation }) => {
  const { isStreamFinished, output } = useStreamTokenArray(redRisingPoemTokenArray);
  return (
    <div className="flex w-full space-y-4 space-x-4">
      <div className="w-1/2">
        <AppMarkdownStreaming
          content={output}
          isStreamFinished={isStreamFinished}
          animation={animation}
          animationDuration={700}
          animationTimingFunction="ease-in-out"
        />
      </div>
      <div className="flex w-1/2 flex-col space-y-2 rounded-md border border-gray-200 p-4">
        <h1 className="bg-gray-100 p-2 text-2xl font-bold">ACTUAL OUTPUT FROM LLM</h1>
        <div className="border border-gray-400 p-4">
          <pre className="text-sm whitespace-pre-wrap">{output}</pre>
        </div>
      </div>
    </div>
  );
};

export const Default: Story = {
  render: () => <StreamingDemo animation="fadeIn" />
};

export const NoAnimation: Story = {
  render: () => {
    const output = redRisingPoemTokenArray.map((token) => token.token).join('');
    const isStreamFinished = true;

    return (
      <div className="w-1/2">
        <AppMarkdownStreaming
          content={output}
          isStreamFinished={isStreamFinished}
          animation={'fadeIn'}
          animationDuration={700}
          animationTimingFunction="ease-in-out"
        />
      </div>
    );
  }
};
