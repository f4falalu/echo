import { throttleBasic, useLLMOutput } from '@llm-ui/react';
import { LLMAnimatedMarkdown } from './LLMAnimatedMarkdown';
import CodeComponentStreaming from './CodeComponentStreaming';
import { codeBlockLookBack, findCompleteCodeBlock, findPartialCodeBlock } from '@llm-ui/code';
import { markdownLookBack } from '@llm-ui/markdown';

const throttle = throttleBasic({
  // show output as soon as it arrives
  readAheadChars: 0,
  // stay literally at the LLM’s pace
  targetBufferChars: 10,
  adjustPercentage: 0.4,
  frameLookBackMs: 10000,
  // split that into 250 ms windows for smoothing
  windowLookBackMs: 250
});

export const useMarkdownStreaming = ({
  content,
  isStreamFinished
}: {
  content: string;
  isStreamFinished: boolean;
}) => {
  return useLLMOutput({
    llmOutput: content,
    fallbackBlock: {
      component: LLMAnimatedMarkdown,
      lookBack: markdownLookBack()
    },
    blocks: [
      {
        component: CodeComponentStreaming,
        findCompleteMatch: findCompleteCodeBlock(),
        findPartialMatch: findPartialCodeBlock(),
        lookBack: codeBlockLookBack()
      }
    ],
    isStreamFinished,
    throttle
  });
};
